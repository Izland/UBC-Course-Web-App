import { doesNotReject } from "assert";
import { filter } from "jszip";
import {Decimal} from "decimal.js";
import Log from "../Util";
import { IInsightFacade, InsightDataset, InsightDatasetKind,
    InsightError, NotFoundError, ResultTooLargeError } from "./IInsightFacade";
import apply = Reflect.apply;

export default class PerformQuerySearches {
    // Assumes query is valid
    public static searchItems(query: any, dataset: any): Promise<any[]> {

        return new Promise((resolve, reject) => {
            let filteredItems: object[] = [];
            // In case query does not have a filter, check to see if dataset is small enough to continue
            if (Object.keys(query["WHERE"]).length === 0 && dataset.items.length > 5000 &&
                typeof query["TRANSFORMATIONS"] === "undefined") {
                reject(new ResultTooLargeError());
            }

            for (const item of dataset.items) {
                if (this.shouldItemBeQueried(query["WHERE"], item)) {
                    filteredItems.push(item);
                }
                if (filteredItems.length > 5000 && typeof query["TRANSFORMATIONS"] === "undefined") {
                    reject(new ResultTooLargeError());
                }
            }

            if (typeof query["TRANSFORMATIONS"] !== "undefined") {
                filteredItems = this.withTransformations(filteredItems, query["TRANSFORMATIONS"]["GROUP"],
                    query["TRANSFORMATIONS"]["APPLY"]);
            }

            // console.log("filtered Items: " + JSON.stringify(filteredItems));

            // Take returned entries and convert them into objects containing only columns given
            let minimizedFilteredItems: any[] = [];
            minimizedFilteredItems = filteredItems.map((item) => {
                return this.createMinimizedObject(item, query["OPTIONS"]["COLUMNS"]);
            });
            // console.log(minimizedFilteredItems);
            return resolve(minimizedFilteredItems);
        });
    }

    public static withTransformations(datasetItems: object[], group: any[], applyArray: any[]): any[] {
        let map: Map<string, object[]> = new Map<string, object[]>();
        let data: any;
        for (data of datasetItems) {
            let key = "";
            for (let eachGroupKey of group) {
                let tempKey = data[eachGroupKey];
                if (typeof tempKey !== "string") {
                    tempKey = String(tempKey);
                }
                key = key + "|" + tempKey;
            }
            if (map.has(key)) {
                map.get(key).push(data);
            } else {
                map.set(key, [data]);
            }
        }
        map.forEach((dataArray) => {
            for (let eachApply of applyArray) {
                dataArray = this.applyFunction(dataArray, eachApply);
            }
        }
        );
        let res = [];
        // const iterator = map.values();
        // for (let i = 0; i < map.size; i++) {
        //     res.push(iterator.next().value);
        // }
        for (let [key, value] of map) {
            // console.log("toaster: " + key);
            // console.log("telephone: " + JSON.stringify(value));
            res.push(value[0]);
            // for (let eachVal of value) {
            //     res.push(eachVal);
            // }
        }
        // console.log(res);
        return res;
    }

    public static applyFunction(group: any, applyRule: any): any {
        let obj = applyRule[Object.keys(applyRule)[0]][Object.keys(applyRule[Object.keys(applyRule)[0]])[0]];
        if (Object.keys(applyRule[Object.keys(applyRule)[0]])[0] === "COUNT") {
            let countArr: any[] = [];
            for (let each of group) {
                if (!(countArr.includes(each[obj]))) {
                    countArr.push(each[obj]);
                }
            }
            let length = countArr.length;
            group[0][Object.keys(applyRule)[0]] = length;
        } else if (Object.keys(applyRule[Object.keys(applyRule)[0]])[0] === "MIN") {
            let minVal = Infinity;
            for (let each of group) {
                if (!(each[obj] >= minVal)) {
                    minVal = each[obj];
                }
            }
            group[0][Object.keys(applyRule)[0]] = minVal;
        } else if (Object.keys(applyRule[Object.keys(applyRule)[0]])[0] === "AVG") {
            let tot = new Decimal(0);
            let avg;
            for (let each of group) {
                tot = Decimal.add(tot, new Decimal(each[obj]));
            }
            let length = group.length;
            const finalAvgRes = tot.toNumber() / length;
            avg = Number(finalAvgRes.toFixed(2));
            group[0][Object.keys(applyRule)[0]] = avg;
        } else if (Object.keys(applyRule[Object.keys(applyRule)[0]])[0] === "SUM") {
            let tot = new Decimal(0);
            let sum;
            for (let each of group) {
                tot = Decimal.add(tot, each[obj]);
            }
            sum  = Number(tot.toFixed(2));
            group[0][Object.keys(applyRule)[0]] = sum;
        } else if (Object.keys(applyRule[Object.keys(applyRule)[0]])[0] === "MAX") {
            let maxVal = -Infinity;
            for (let each of group) {
                if (each[obj] > maxVal) {
                    maxVal = each[obj];
                }
            }
            group[0][Object.keys(applyRule)[0]] = maxVal;
        }
        return group;
    }

    public static getDatasetNameFromQuery(query: any): string {
        if (typeof query["TRANSFORMATIONS"] === "undefined") {
            let queryColumn: string = query["OPTIONS"]["COLUMNS"][0];
            return queryColumn.replace(/_(\w)+/, "");
        } else {
            let queryColumn: string = query["TRANSFORMATIONS"]["GROUP"][0];
            return queryColumn.replace(/_(\w)+/, "");
        }
    }

    public static shouldItemBeQueried(query: any, obj: any): boolean {
        // Iterate over each comparison and check validity
        let filterKey = Object.keys(query)[0];
        if (filterKey === undefined) {
            return true;
        }
        if (filterKey === "AND") {
            for (let comparison of query[filterKey]) {
                // For each comparison, confirm true and throw false if any are false
                if (!this.shouldItemBeQueried(comparison, obj)) {
                    return false;
                }
            }
            return true;
        } else if (filterKey === "OR") {
            for (let comparison of query[filterKey]) {
                // For each comparison, confirm true if any are true
                if (this.shouldItemBeQueried(comparison, obj)) {
                    return true;
                }
            }
            return false;
        } else {
            // Grabs nested key/value inside of filter
            let propertyKey: any = Object.keys(query[filterKey])[0];
            let queryValue: any = Object.values(query[filterKey])[0];

            if (filterKey === "GT") {
                return obj[propertyKey] > queryValue;
            } else if (filterKey === "LT") {
                return obj[propertyKey] < queryValue;
            } else if (filterKey === "EQ" ) {
                return obj[propertyKey] === queryValue;
            } else if (filterKey === "IS") {
                if (queryValue.includes("*")) {
                    return this.wildCardCheck(obj[propertyKey], queryValue);
                }
                let re = new RegExp("^" + queryValue + "$");
                return obj[propertyKey].match(re) !== null;
            } else if (filterKey === "NOT") {
                return !this.shouldItemBeQueried(query[filterKey], obj);
            }
        }
        return false;
    }

    private static wildCardCheck(objValue: string, queryValue: string): boolean {
        let strippedQuery = queryValue.replace(/\*/g, "");
        if (queryValue.match(/^\*$/) !== null || queryValue.match(/^\*\*$/g) !== null) {
            return true;
        } else if (queryValue.match(/\*\w+$/) !== null) {
            strippedQuery = strippedQuery + "$";
        } else if (queryValue.match(/^\w+\*$/) !== null) {
            strippedQuery = "^" + strippedQuery;
        }
        let re = new RegExp(strippedQuery);
        return objValue.match(re) !== null;
    }

    public static createMinimizedObject(obj: any, columns: string[]): any {
        const minimizedObject: any = {};

        for (const column of columns) {
            minimizedObject[column] = obj[column];
        }
        return minimizedObject;
    }

    public static orderItems(filteredItems: any[], order: any): Promise<any[]> {
        if (typeof order === "undefined") {
            return Promise.resolve(filteredItems);
        } else if (typeof order === "string") {
            let orderArr: any[] = [order];
            return Promise.resolve(this.orderArrayUp(filteredItems, orderArr));
        } else {
            if (order["dir"] === "UP") {
                filteredItems = this.orderArrayUp(filteredItems, order["keys"]);
                return Promise.resolve(filteredItems);
            } else {
                filteredItems = this.orderArrayDown(filteredItems, order["keys"]);
                return Promise.resolve(filteredItems);
            }
        }
    }

    private static orderArrayUp(filteredItems: any[], order: any[]): any[] {
        filteredItems.sort((itemA, itemB) => {
            const itemAValueToOrder = itemA[order[0]];
            const itemBValueToOrder = itemB[order[0]];
            if (itemAValueToOrder === "") {
                return -1;
            } else if (itemBValueToOrder === "") {
                return 1;
            } else if (itemAValueToOrder > itemBValueToOrder) {
                return 1;
            } else if (itemAValueToOrder < itemBValueToOrder) {
                return -1;
            } else {
                return this.tieBreakerUp(itemA, itemB, order);
            }
        });
        return filteredItems;
    }

    private static orderArrayDown(filteredItems: any[], order: any): any[] {
        filteredItems.sort((itemA, itemB) => {
            const itemAValueToOrder = itemA[order[0]];
            const itemBValueToOrder = itemB[order[0]];
            if (itemAValueToOrder === "") {
                return -1;
            } else if (itemBValueToOrder === "") {
                return 1;
            } else if (itemAValueToOrder < itemBValueToOrder) {
                return 1;
            } else if (itemAValueToOrder > itemBValueToOrder) {
                return -1;
            } else {
                return this.tieBreakerDown(itemA, itemB, order);
            }
        });
        return filteredItems;
    }

    private static tieBreakerUp(itemA: any, itemB: any, order: any[]) {
        for (let each of order) {
            if (itemA[each] > itemB[each]) {
                return 1;
            } else if (itemA[each] < itemB[each]) {
                return -1;
            }
        }
        return 0;
    }

    private static tieBreakerDown(itemA: any, itemB: any, order: any) {
        for (let each of order) {
            if (itemA[each] < itemB[each]) {
                return 1;
            } else if (itemA[each] > itemB[each]) {
                return -1;
            }
        }
        return 0;
    }
}
