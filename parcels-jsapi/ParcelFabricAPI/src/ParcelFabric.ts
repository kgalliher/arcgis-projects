import esriRequest from "@arcgis/core/request.js";
import VersionIdentifier from "@arcgis/core/versionManagement/VersionManagementService.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import Query from "@arcgis/core/rest/support/Query.js";

export interface Record {
    recordName: string;
    recordGuid: string;
}

export class ParcelFabricServer {
    private _pfUrl: string;
    private _baseUrl: string;
    private _fsUrl: string;
    private _recordsLayerUrl
    public activeRecord: Record;
    public versionName: string;

    constructor(baseUrl: string, versionName: string) {
        this._baseUrl = baseUrl;
        this._fsUrl = `${this._baseUrl}FeatureServer`;
        this._pfUrl = `${this._baseUrl}/ParcelFabricServer`;
        this._recordsLayerUrl = `${this._fsUrl}/1`;
        this.versionName = versionName;
    }

    getRecordsLayer(): FeatureLayer {
        const fl: FeatureLayer = new FeatureLayer({
            url: this._recordsLayerUrl
        });
        return fl;
    }

    getRecordByName(recordName: string): Promise<Record> {
        return new Promise((resolve, reject) => {
            const fl = this.getRecordsLayer()

            let query = fl.createQuery();
            // query.where = "Name = 'Record001'";
            query.where = `Name = '${recordName}'`;
            query.outFields = ["OBJECTID", "Name", "GlobalID"];
            query.gdbVersion = this.versionName;
            fl.queryFeatures(query)
                .then((res) => {
                    console.log(res)
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                })
        })
    }

    setExistingRecord(recordName: string) {
        return new Promise((resolve, reject) => {
            this.getRecordByName(recordName)
                .then((res) => {
                    console.log(res)
                })
        })
    }
}
