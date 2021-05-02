import {
    IInsightFacade, InsightDataset, InsightDatasetKind,
    InsightError, NotFoundError, ResultTooLargeError
} from "./IInsightFacade";

export default class AddDatasetCourseHelpers {
    public static loadCourseDataset(id: string, content: string): Promise<any[]> {
        const currZip = require("jszip");
        return new Promise<string[]>((resolve, reject) => {
            return currZip.loadAsync(content, { base64: true })
                .then((zip: any) => {
                    return this.destructZipFolder(zip);
                })
                .then((fileContentsArray: string[]) => {
                    return resolve(this.jsonifyCourseContent(fileContentsArray, id));
                })
                .catch(() => reject(new InsightError()));
        });
    }

    private static destructZipFolder(zip: any): Promise<string[]> {
            let promiseArray: Array<Promise<string>> = [];
            // Checks to see if root folder "courses" exists in dataset
            if (zip.folder(/courses/).length === 0) {
                return Promise.reject(new InsightError("No root folder"));
            }
            // Now we need to convert each file to JSON stringified
            zip.folder("courses").forEach((relativePath: string, file: any) => {
                promiseArray.push(file.async("string"));
            });
            // Could be problematic if a single promise rejects?
            return Promise.all(promiseArray);
    }

    private static jsonifyCourseContent(fileContentsArray: string[], id: string): any[] {
        let courseArray: any[] = [];
        fileContentsArray.forEach((fileContent: string) => {
            try {
                let courseData = JSON.parse(fileContent);
                courseArray = courseArray.concat(this.createCourseObjects(courseData, id));
            } catch (e) {
                if (e instanceof SyntaxError) {
                    return;
                }
                throw e;
            }
        });
        if (courseArray.length === 0) {
            throw new InsightError();
        }
        return courseArray;
    }

    public static updateDatasetsWithCourseDataset(datasetField: any, courses: any[], id: string): any {
        const datasetObj = {
            meta: {
                id: id,
                kind: InsightDatasetKind.Courses,
                numRows: courses.length
            },
            items: courses
        };
        datasetField[id] = datasetObj;
        return datasetField;
    }

    private static createCourseObjects(courseData: any, id: string): any[] {
        const courseSections = courseData["result"];
        const arrayOfCourseObjects: any[] = [];
        // courseDataProperties and courseObjectProperties should be same length
        const courseDataProperties: string[] = ["Subject", "Course",
            "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year"];
        const courseObjectProperties: string[] = ["dept", "id",
            "avg", "instructor", "title", "pass", "fail", "audit", "uuid", "year"];
        // Iterates over each section, checking to see if each courseDataProperty exists in the section
        // and adds it to the courseObject if present or null to it if not
        courseSections.forEach((section: any) => {
            const courseObject: any = {};
            for (let i = 0; i < courseDataProperties.length; i++) {
                if (section.hasOwnProperty(courseDataProperties[i])) {
                    courseObject[`${id}_${courseObjectProperties[i]}`] = section[courseDataProperties[i]];
                } else {
                    courseObject[`${id}_${courseObjectProperties[i]}`] = "";
                }
            }
            if (section["Section"] === "overall") {
                courseObject[`${id}_year`] = 1900;
            }
            const updatedObj = this.convertObjectPropertyTypes(courseObject, id);
            arrayOfCourseObjects.push(updatedObj);
        });

        return arrayOfCourseObjects;
    }

    private static convertObjectPropertyTypes(courseObj: any, id: string): any {
        courseObj[`${id}_year`] = parseInt(courseObj[`${id}_year`], 10);
        courseObj[`${id}_uuid`] = courseObj[`${id}_uuid`].toString();
        return courseObj;
    }

}
