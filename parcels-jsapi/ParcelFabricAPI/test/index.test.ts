import { ParcelFabricServer } from "../src/ParcelFabric";
import VersionManagementService from "@arcgis/core/versionManagement/VersionManagementService";

const vms = new VersionManagementService({ url: "https://krennic.esri.com/server/rest/services/Sheboygan109/VersionManagementService" });

const parcelFabric = new ParcelFabricServer("https://krennic.esri.com/server/rest/services/Sheboygan109/", "ADMIN.EditorJS");

import { expect, test } from 'vitest'
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

test("Test runs", () => {
    expect(1).toBe(1);
})

test("Returns FeatureLayer", async () => {
    expect(await parcelFabric.getRecordsLayer()).toBeInstanceOf(FeatureLayer);
})

test("Returns type Record", async () => {
    expect(await parcelFabric.setExistingRecord("Record001")).toHaveProperty("name");
})

