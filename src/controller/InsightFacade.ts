import Log from "../Util";
import {
    IInsightFacade, InsightDataset, InsightDatasetKind,
    InsightError, NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import AddDatasetCourseHelpers from "./AddDatasetCourseHelpers";
import AddDatasetRoomHelpers from "./AddDatasetRoomHelpers";
import PerformQueryChecks from "./PerformQueryChecks";
import PerformQuerySearches from "./PerformQuerySearches";
import PerformQueryOptionsChecks from "./PerformQueryOptionsChecks";
import PerformQueryTransformationsCheck from "./PerformQueryTransformationsCheck";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private datasets: { [id: string]: { meta: InsightDataset, items: any[] } } = {};

    constructor() {
        const fs = require("fs");
        const path = require("path");
        try {
            const data = fs.readFileSync(path.join(__dirname, "../../data/datasets.json"));
            this.datasets = JSON.parse(data);
        } catch (err) {
            if (!(err.code === "ENOENT")) {
                throw err;
            } else {
                Log.warn("No initial dataset to store");
            }
        }
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, reject) => {
            let listOfIds: any[] = Object.keys(this.datasets);
            if (id.includes("_") || this.IDAllWhitespaceCheck(id) || listOfIds.includes(id) ||
                (kind !== InsightDatasetKind.Courses && kind !== InsightDatasetKind.Rooms)) {
                return reject(new InsightError("At least one argument is invalid"));
            } else {
                if (kind === InsightDatasetKind.Courses) {

                    // Get course array
                    return AddDatasetCourseHelpers.loadCourseDataset(id, content)
                        .then((courses: any[]) => resolve({ kind: InsightDatasetKind.Courses, items: courses }))
                        .catch(() => reject(new InsightError()));
                } else {
                    // Get room array
                    return AddDatasetRoomHelpers.loadRoomDataset(id, content)
                        .then((rooms: any[]) => resolve({ kind: InsightDatasetKind.Rooms, items: rooms }))
                        .catch(() => reject(new InsightError()));
                }
            }
        })
            .then((datasetObj: any) => {
                if (datasetObj.kind === InsightDatasetKind.Courses) {
                    this.datasets = AddDatasetCourseHelpers
                        .updateDatasetsWithCourseDataset(this.datasets, datasetObj.items, id);
                } else {
                    this.datasets = AddDatasetRoomHelpers
                        .updateDatasetsWithRoomDataset(this.datasets, datasetObj.items, id);
                }
                this.writeData();
                return Promise.resolve(Object.keys(this.datasets));
            }).catch(() => Promise.reject(new InsightError()));
    }

    private IDAllWhitespaceCheck(id: string): boolean {
        let val = id.replace(/\s/g, "");
        return val.length <= 0;
    }

    private writeData() {
        const fs = require("fs");
        const path = require("path");
        const stringifiedJSON = JSON.stringify(this.datasets);
        fs.writeFileSync(path.join(__dirname, "../../data/datasets.json"), stringifiedJSON);
    }

    public removeDataset(id: string): Promise<string> {
        // Check to see if id is valid
        const fs = require("fs");
        const path = require("path");
        let idRegex: RegExp = /^[^_]+$/;
        if (!id.match(idRegex) || id.indexOf(" ") >= 0) {
            return Promise.reject(new InsightError("Id is not valid"));
        }

        // Check if a dataset with the given id is present, reject if not
        if (!this.datasets.hasOwnProperty(id)) {
            return Promise.reject(new NotFoundError());
        }
        // Otherwise, delete the dataset
        delete this.datasets[id];
        // If dataset is successfully removed, pass id of removed dataset
        try {
            const stringifiedJSON = JSON.stringify(this.datasets);
            fs.writeFileSync(path.join(__dirname, "../../data/datasets.json"), stringifiedJSON);
        } catch (err) {
            if (!(err.code === "ENOENT")) {
                throw err;
            }
        }

        return Promise.resolve(id);
    }

    public performQuery(query: any): Promise<any[]> {
        // Check if dataset name even exists
        if (!(PerformQueryChecks.checkTopLevel(query))) {
            return Promise.reject(new InsightError("Does not contain BODY and/or OPTIONS"));
        } else if (!(PerformQueryTransformationsCheck.isTransformationValid(query))) {
            return Promise.reject(new InsightError("Something in the transformations is invalid"));
        } else if (!(PerformQueryOptionsChecks.areOptionsValid(query))) {
            return Promise.reject(new InsightError("Options and/or order are invalid"));
        } else if (!(PerformQueryChecks.isBodyValid(query))) {
            return Promise.reject(new InsightError("Something in the body is invalid"));
        }

        const dataset = this.datasets[PerformQuerySearches.getDatasetNameFromQuery(query)];
        if (dataset === undefined) {
            return Promise.reject(new InsightError("Query references dataset that does not exist"));
        }
        return PerformQuerySearches
            .searchItems(query, dataset)
            .then((returnedCourses: any[]) => {
                return PerformQuerySearches.orderItems(returnedCourses, query["OPTIONS"]["ORDER"]);
            })
            .catch((err) => Promise.reject(err));
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let datasetArray: InsightDataset[] = [];
        Object.values(this.datasets).forEach((dataset) => {
            datasetArray.push(dataset.meta);
        });
        return Promise.resolve(datasetArray);
    }

    public listItems(datasetID: string): any[] {
        if (!(this.datasets.hasOwnProperty(datasetID))) {
            return [];
        }
        return this.datasets[datasetID].items;
    }
}
