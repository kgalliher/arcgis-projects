import esriRequest from "@arcgis/core/request";
import { VersionManagementService, Version } from "./VersionManagement";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export interface Record {
  recordName: string;
  recordGuid: string;
}

/**
 * Class to access the ParcelFabricServer service
 * Manage and create parcel records and execute some 
 * parcel fabric editing functions
 * https://developers.arcgis.com/rest/services-reference/enterprise/overview-of-parcel-fabric-sevices.htm
 */
export class ParcelFabricService {
  private _pfUrl: string;
  private _recordsUrl: string;
  private _versionName: string;
  private _sessionId: string;
  private _baseUrl: string;
  public activeRecord: Record;
  public vms: VersionManagementService;
  public outputMessages = null;

  constructor(baseUrl: string, vms: VersionManagementService) {
    this._baseUrl = baseUrl;
    this._pfUrl = `${baseUrl}ParcelFabricServer`;
    this._recordsUrl = `${baseUrl}FeatureServer/1`;
    this.vms = vms;
    this._versionName = vms.getVersion().versionName;
    this.outputMessages = document.getElementById("outputMessages");
  }

  // function for messaging
  displayMessage(info) {
    this.outputMessages.innerHTML += info;
    this.outputMessages.scrollTop = this.outputMessages.scrollHeight;
  }

  clearMessages() {
    this.outputMessages.innerHTML = "";
  }

  getRecord(recordName: string) {
    return new Promise((resolve, reject) => {
      const fl = new FeatureLayer({
        url: this._recordsUrl
      })

      let query = fl.createQuery();
      query.where = `Name = '${recordName}'`;
      query.outFields = ["OBJECTID", "Name", "GlobalID"]
      query.gdbVersion = this._versionName;
      fl.queryFeatures(query)
        .then((res) => {
          resolve(res)

        })
        .catch((err) => {
          console.log(err);

        })
    })
  }

  //#region Record management
  /* Verify existing/new parcel record 
    - Check if a submitted record exists
    - If the record exists, set that record
    - Else, create a new record with the submitted name
  */

  setExistingRecord(recordName: string) {
    return new Promise((resolve, reject) => {
      this.getRecord(recordName)
        .then((res) => {
          let recordId = res.features[0].attributes["GlobalID"];
          let record: Record = { recordName: recordName, recordGuid: recordId }
          this.activeRecord = record;
          this.displayMessage(`<br><span>Record already exists. Setting:</span> ${this.activeRecord.recordName}`)
          resolve(recordId);
        })
        .then(() => {
          Promise.resolve(this.createRecord(recordName));
        })
        .catch((err) => {
          console.log(err);

        })
    });
  }

  async checkRecordExists(recordName): Promise<any> {
    return new Promise((resolve, reject) => {
      const fl = new FeatureLayer({
        url: this._recordsUrl
      })

      let query = fl.createQuery();
      query.where = `Name = '${recordName}'`;
      query.outFields = ["OBJECTID", "Name", "GlobalID"]
      query.gdbVersion = this._versionName;
      fl.queryFeatures(query)
        .then((res) => {
          if (res.features.length > 0) {
            resolve(true);
          }

          resolve(false);

        })
        .catch((err) => {
          console.log(err);

        })
    })
  }

  /**
   * Uses the /FeatureServer/1 (Records) endpoint to create a new parcel record entry
   * @param recordName 
   * @returns 
   */
  async createRecord(recordName: string): Promise<__esri.RequestResponse> {
    return new Promise((resolve, reject) => {
      this.vms.toggleEditSession("startReading")
        .then((resp) => {
          this.vms.reserveObjectIds(this._recordsUrl, 1)
            .then((resp) => { return resp; })
            .catch((err) => { console.log(err); })
            .then((recordOid) => {
              let sessionId = this.vms.getSessionId();
              const objectId = recordOid.data.firstObjectId;
              const globalid = this.vms.createUUID().toUpperCase();
              let params = {
                f: "json",
                rollbackOnFailure: true,
                sessionId: sessionId,
                useGlobalIds: true,
                gdbVersion: this._versionName,
                returnEditMoment: true,
                returnServiceEditsOption: "originalAndCurrentFeatures",
                usePreviousEditMoment: false,
                edits: `[{"id":1,"adds":[{"attributes":{"objectid":${objectId},"name":"${recordName}","recordtype":null,"recordeddate":null,"cogoaccuracy":null,"created_user":null,"create_date":null,"last_edited_user":null,"last_edited_date":null,"parcelcount":null,"globalid":"{${globalid}}","Shape__Area":0,"Shape__Length":0},"geometry":{"hasZ":true,"rings":[],"spatialReference":{"wkid":2926,"latestWkid":2926,"xyTolerance":0.0032808333333333331,"zTolerance":0.001,"mTolerance":0.001,"falseX":-117104300,"falseY":-99539600,"xyUnits":3048.0060960121928,"falseZ":-100000,"zUnits":10000,"falseM":-100000,"mUnits":10000}}}]}]`,
              }
              return params
            })
            .then((params) => {
              esriRequest(this._baseUrl + "FeatureServer/applyEdits", {
                method: "post",
                "responseType": "json",
                query: params
              })
                .then((resp) => {
                  if (resp.data[0].addResults[0].success) {
                    let recordId = resp.data[0].addResults[0].globalId;
                    let record: Record = { recordName: recordName, recordGuid: recordId }
                    this.activeRecord = record;
                    return this.activeRecord;
                  }
                })
                .then((resp) => {
                  resolve(resp);
                  this.vms.toggleEditSession("stopReading");
                })
                .catch((err) => {
                  console.log(err);
                  reject(false);
                })
            })
        })
        .catch((err) => {
          reject(false);
          console.log(err)
        })
    });
  }

  //#endregion

  /**
   * To participate in parcel fabric functions, a parcel feature requires its 
   * CreateByRecord value to be updated with the GlobalID of the "active record".
   * The assignFeaturesToRecord function adds the CreatedByRecord value to the feature.
   * https://developers.arcgis.com/rest/services-reference/enterprise/assigntorecord-parcel-fabric-server.htm
   * @param layerId the layerId of the target feature
   * @param addedFeatureGuid the globalid of the target feature
   * @returns Promise<void>
   */
  assignFeatureToRecord(layerId: number, addedFeatureGuid: string): Promise<__esri.RequestResponse> {
    return new Promise((resolve, reject) => {
      this.vms.toggleEditSession("startReading")
        .then((res) => {
          const sessionId = this.vms.getSessionId();
          const activeRecordGuid = this.activeRecord.recordGuid;
          const versionName = this.vms.getVersion().versionName;

          let assignToRecordOptions = {
            "f": "json",
            "gdbVersion": versionName,
            "sessionId": sessionId,
            "record": activeRecordGuid,
            "parcelFeatures": `[{"id":"${addedFeatureGuid}","layerId":"${layerId}"}]`,
            "writeAttribute": "CreatedByRecord",
            "async": false,
          }

          esriRequest(this._pfUrl + "/assignFeaturesToRecord", {
            "method": "post",
            "responseType": "json",
            "query": assignToRecordOptions
          })
            .then(function (response) {
              if (response.data.success === true) {
                resolve(response.data.serviceEdits);

              }
            })
            .then(() => {
              // stop the reading session
              this.vms.toggleEditSession("stopReading");
            })
            .catch((err) => {
              this.vms.toggleEditSession("stopReading");
              reject(err);
            })
        })
        .catch((err) => {
          console.log(err);
          this.displayMessage(err);
        })
    })
  }

  /**
   * Create parcel seeds for closed loops of lines that are associated with the specified record.
   * https://developers.arcgis.com/rest/services-reference/enterprise/createseeds-parcel-fabric-server.htm
   * @returns Promise<void>
   */
  createSeeds(): Promise<__esri.RequestResponse> {
    return new Promise((resolve, reject) => {
      this.vms.toggleEditSession("startReading")
        .then((res) => {
          const sessionId = this.vms.getSessionId();
          const activeRecordGuid = this.activeRecord.recordGuid;
          const versionName = this.vms.getVersion().versionName;

          let createSeedsOptions = {
            "f": "json",
            "gdbVersion": versionName,
            "sessionId": sessionId,
            "record": activeRecordGuid,
            "async": false,
          }

          esriRequest(this._pfUrl + "/createSeeds", {
            "method": "post",
            "responseType": "json",
            "query": createSeedsOptions
          })
            .then(function (response) {
              if (response.data.success === true) {
                resolve(response.data.serviceEdits);
              }
            })
            .then(() => {
              // stop the reading session
              this.vms.toggleEditSession("stopReading");
            })
            .catch((err) => {
              reject(err);
            })
        })
        .catch((err) => {
          console.log(err);
          this.displayMessage(err);
        })
    })
  }

  /**
   * Build creates parcels from polygons or lines by creating missing parcel features.
   * https://developers.arcgis.com/rest/services-reference/enterprise/build-parcel-fabric-server.htm
   * @returns 
   */
  buildRecord(): Promise<__esri.RequestResponse> {
    return new Promise((resolve, reject) => {
      this.vms.toggleEditSession("startReading")
        .then((res) => {
          const sessionId = this.vms.getSessionId();
          const activeRecordGuid = this.activeRecord.recordGuid;
          const versionName = this.vms.getVersion().versionName;

          const buildOptions = {
            "f": "json",
            "gdbVersion": versionName,
            "sessionId": sessionId,
            "record": activeRecordGuid,
            "async": false,
          }

          esriRequest(this._pfUrl + "/build", {
            "method": "post",
            "responseType": "json",
            "query": buildOptions
          })
            .then(function (response) {
              if (response.data.success === true) {
                // const resultVal = processMergeResult(response.data.serviceEdits)
                resolve(response.data.serviceEdits);

              }
            })
            .then(() => {
              // stop the reading session
              this.vms.toggleEditSession("stopReading");
            })
            .catch((err) => {
              reject(err);
            })
        })
        .catch((err) => {
          console.log(err);
          this.displayMessage(err);
        })
    })
  }

  /**
   * Copies selected lines or the lines of selected parcels to the specified parcel type and specified record.
   * https://developers.arcgis.com/rest/services-reference/enterprise/copylinesto-parcel-fabric-server.htm
   * @param selectedFeatures an array of globalIds and layerIds of selected parcel polygons
   * @returns Promis<void>
   */
  copyLinesTo(selectedFeatures: __esri.Feature[]): Promise<__esri.RequestResponse> {
    return new Promise((resolve, reject) => {
      this.vms.toggleEditSession("startReading")
        .then((res) => {
          let sessionId = this.vms.getSessionId();
          let activeRecordGuid = this.activeRecord.recordGuid;
          let versionName = this.vms.getVersion().versionName;
          let parentParcels: { id: string, layerId: string }[] = [];
          selectedFeatures.forEach((item) => {
            let parentParcel = { "id": item.attributes.GlobalID, "layerId": String(item.layer.layerId) };
            parentParcels.push(parentParcel);
          });
          let parentParcelsStr = JSON.stringify(parentParcels);
          const moment = Math.round((new Date()).getTime() / 1000);

          let copyLinesToOptions = {
            "f": "json",
            "gdbVersion": versionName,
            "sessionId": sessionId,
            "parentParcels": parentParcelsStr,
            "record": activeRecordGuid,
            "markParentAsHistoric": true,
            "useSourceLineAttributes": true,
            "useSourcePolygonAttributes": true,
            "targetParcelType": 15,
            "targetParcelSubtype": -1000,
            "attributeOverrides": '{"type":"PropertySet","propertySetItems":[]}',
            "async": false,

          }
          console.log(copyLinesToOptions);

          esriRequest(this._pfUrl + "/copyLinesToParcelType", {
            "method": "post",
            "responseType": "json",
            "query": copyLinesToOptions
          })
            .then(function (response) {
              if (response.data.success === true) {
                // const resultVal = processMergeResult(response.data.serviceEdits)
                resolve(response.data.serviceEdits);
              }
            })
            .then(() => {
              // stop the reading session
              this.vms.toggleEditSession("stopReading");
            })
            .catch((err) => {
              reject(err);
            })
        })
        .catch((err) => {
          console.log(err);
          this.displayMessage(err);
        })
    });
  }

  /**
   * Merge creates a new parcel by merging two or more existing parcels in the parcel fabric.
   * https://developers.arcgis.com/rest/services-reference/enterprise/merge-parcel-fabric-server.htm
   * @param mergedFeatureName 
   * @param mergedFeatureStatedArea 
   * @param selectedFeatures 
   * @returns Promise<void>
   */
  mergeParcels(mergedFeatureName: string, mergedFeatureStatedArea: number, selectedFeatures: __esri.Feature[]): Promise<__esri.RequestResponse> {
    return new Promise((resolve, reject) => {
      this.vms.toggleEditSession("startReading")
        .then((res) => {
          let sessionId = this.vms.getSessionId();
          let activeRecordGuid = this.activeRecord.recordGuid;
          let versionName = this.vms.getVersion().versionName;
          let parentParcels: { id: string, layerId: string }[] = [];
          selectedFeatures.forEach((item) => {
            let parentParcel = { "id": item.attributes.GlobalID, "layerId": String(item.layer.layerId) };
            parentParcels.push(parentParcel);
          });
          let propertySet = `{"type":"PropertySet","propertySetItems":["name","${mergedFeatureName}","StatedArea", "${mergedFeatureStatedArea}", "isseed",0]}`;
          let parentParcelsStr = JSON.stringify(parentParcels);
          let moment = Math.round((new Date()).getTime() / 1000);
          let mergeOptions = {
            "f": "json",
            "gdbVersion": versionName,
            "sessionId": sessionId,
            "parentParcels": parentParcelsStr,
            "record": activeRecordGuid,
            "mergeInto": "{00000000-0000-0000-0000-000000000000}",
            "moment": moment,
            "targetParcelType": selectedFeatures[0].layer.layerId,
            "defaultAreaUnit": 109405,
            "attributeOverrides": propertySet,
          }
          esriRequest(this._pfUrl + "/merge", {
            "method": "post",
            "responseType": "json",
            "query": mergeOptions
          })
            .then(function (response) {
              if (response.data.success === true) {
                // const resultVal = processMergeResult(response.data.serviceEdits)
                resolve(response.data.serviceEdits);
              }
            })
            .then(() => {
              // stop the reading session
              this.vms.toggleEditSession("stopReading");
            })
            .catch((err) => {
              reject(err);
            })
        })
        .catch((err) => {
          console.log(err);
        })
    });
  }
}
