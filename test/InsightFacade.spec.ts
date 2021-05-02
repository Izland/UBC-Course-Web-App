import * as chai from "chai";
import { expect } from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import { InsightDataset, InsightDatasetKind, InsightError, NotFoundError } from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import AddDatasetRoomHelpers from "../src/controller/AddDatasetRoomHelpers";
import AddDatasetRoomGetters from "../src/controller/AddDatasetRoomGetters";
import { rejects } from "assert";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        test1: "./test/data/test1.pdf",
        test2: "./test/data/test2.zip",
        simpleCourses: "./test/data/simpleCourses.zip",
        noCoursesFolder: "./test/data/NoCoursesFolder.zip",
        noJson: "./test/data/NoJson.zip",
        badJson: "./test/data/badJson.zip",
        someBadJson: "./test/data/someBadJson.zip",
        rooms: "./test/data/rooms.zip",
        randomname: "./test/data/randomname.zip",
        noindex: "./test/data/noindex.zip",
        missing: "./test/data/missing.zip",
        simplerooms: "./test/data/simplerooms.zip",
        norooms: "./test/data/norooms.zip",
        invalidgeo: "./test/data/invalidgeo.zip",
        indexwronglocation: "./test/data/indexwronglocation.zip",
        indexnodmp: "./test/data/indexnodmp.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }


        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // ADD DATASET TESTS
    it("Should add a valid dataset", function () {
        const id: string = "test2";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should not add a dataset that has no root folder", function () {
        const id: string = "noCoursesFolder";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not add a dataset that has no json files", function () {
        const id: string = "noJson";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should add a dataset and skip over bad json files", function () {
        const id: string = "someBadJson";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should not add a dataset that has bad json files", function () {
        const id: string = "badJson";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not add a dataset with a whitespace id", function () {
        const futureResult: Promise<string[]> = insightFacade.addDataset(" ",
            datasets["courses"], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not add a dataset with an underscore in the id", function () {
        const futureResult: Promise<string[]> = insightFacade.addDataset("_courses",
            datasets["courses"], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not add a dataset that has already been added", function () {
        const id: string = "test2";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id],
            InsightDatasetKind.Courses).then(() =>
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses));
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Give a non-valid id (whitespace) and expect InsightError", function () {
        const id: string = " ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Give a non-valid id (with underscore) and expect InsightError", function () {
        const id: string = "hello_world";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("try to invalid id, invalid content -> then add dataset", function () {
        let id: string = " ";
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
            id = "test2";
            const expected: string[] = [id];
            futureResult = insightFacade.addDataset(
                id,
                datasets[id],
                InsightDatasetKind.Courses
            );
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });

    it("try to add invalid id, valid content -> then add dataset", function () {
        let id: string = " ";
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
            id = "test2";
            const expected: string[] = [id];
            futureResult = insightFacade.addDataset(
                id,
                datasets[id],
                InsightDatasetKind.Courses
            );
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });

    it("try to add same dataset twice, throw insight error", function () {
        let id: string = "test2";
        const expected: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            futureResult = insightFacade.addDataset(
                id,
                datasets[id],
                InsightDatasetKind.Courses
            );
            return expect(futureResult).to.be.rejectedWith(InsightError);
        });
    });

    it("Give a non-valid file type (test1.pdf)", function () {
        const id: string = "test1";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should try to add invalid content", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["x"],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should try to add invalid content but invalid id and invalid kind", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["x"],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should try to add invalid content", function () {
        const id: string = " ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });
    // C2 addDataset tests

    it("should add a valid room dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("should not add a room dataset without index.htm in the root of the rooms directory", function () {
        const id: string = "noindex";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("should not add a room dataset that has a folder with the same id as the dataset instead of /rooms",
        function () {
        const id: string = "randomname";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("should add a valid room dataset that has missing values", function () {
        // I edited the CHEM building file in missing.zip. Room B150 no longer has a capacity
        const id: string = "missing";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );

        return futureResult.then(() => {
            const rooms: any[] = insightFacade.listItems(id);
            return expect(rooms.length).to.equal(6);
        })
        .catch((err) => {
            throw new Error();
        });
    });

    it("should add a valid room dataset that skips a building with no valid rooms", function () {
        const id: string = "simplerooms";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );

        return futureResult.then(() => {
            const rooms: any[] = insightFacade.listItems(id);
            return expect(rooms.length).to.equal(11);
        });
    });

    it("should not add a room dataset with no valid rooms", function () {
        const id: string = "norooms";
        const futureResult: Promise<any> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("should add a valid room dataset and skip over a building if its geolocation results result in an error",
        function () {
        const id: string = "invalidgeo";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return futureResult.then(() => {
            const rooms: any[] = insightFacade.listItems(id);
            return expect(rooms.length).to.equal(6);
        });
    });

    it("should not add a room dataset with index.htm placed in the wrong location", function () {
        const id: string = "indexwronglocation";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("should add a dataset and ensure that the value types recorded are correct", function () {
        const testObj: { [key: string]: any} = {
            rooms_fullname: "abc",
            rooms_shortname: "abc",
            rooms_number: "abc",
            rooms_name: "abc",
            rooms_address: "abc",
            rooms_lat: 2,
            rooms_lon: 3,
            rooms_seats: 4,
            rooms_furniture: "abc",
            rooms_href: "abc",
            rooms_type: "abc"
        };
        const id: string = "simplerooms";
        const futureResult: Promise<string> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        ).then(() => {
            const rooms: any[] = insightFacade.listItems(id);
            for (const room of rooms) {
                for (const prop in testObj) {
                    if (typeof room[prop] !== typeof testObj[prop]) {
                        return Promise.reject(new InsightError("Types don't match"));
                    }
                }
            }
            return Promise.resolve("Success!");
        });

        return expect(futureResult).to.eventually.equal("Success!");

    });

    it("should not add a room dataset with a null datasetkind passed as an argument", function () {
        const id: string = "simplerooms";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            null
        );
        expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("should not parse buildings not included in the index.htm file", function () {
        const id: string = "indexnodmp";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return futureResult.then(() => {
            const rooms =  insightFacade.listItems(id);
            return expect(rooms).to.have.length(6);
        });
    });

    it("should add the correct room data to the dataset", function () {
        const roomData: {[id: string]: any} = {
            rooms_fullname: "Chemistry",
            rooms_shortname: "CHEM",
            rooms_number: "B150",
            rooms_name: "CHEM_B150",
            rooms_address: "2036 Main Mall",
            rooms_lat: 49.2659,
            rooms_lon: -123.25308,
            rooms_seats: 265,
            rooms_furniture: "Classroom-Fixed Tablets",
            rooms_href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/CHEM-B150",
            rooms_type: "Tiered Large Group"
        };
        const id: string = "simplerooms";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );

        return futureResult.then(() => {
            const rooms = insightFacade.listItems(id);
            for (const room of rooms) {
                if (room.rooms_number === "B150") {
                    return expect(room).to.deep.equal(roomData);
                }
            }
            throw new Error();
        });
    });

    it("should return the correct lat, lon of a building", function () {
        const location: {[id: string]: number} = {
            lat: 49.26125,
            lon: -123.24807
        };
        const chemObj = AddDatasetRoomGetters.getBuildingCoordinates("6245 Agronomy Road V6T 1Z4");
        return expect(chemObj).to.eventually.deep.equal(location);
    });

    it("should place the correct default value (0) for a room if necessary", function () {
        return false;
    });

    // Remove valid datasets
    it("Should remove a valid dataset", function () {
        const id: string = "simpleCourses";
        const futureResult: Promise<string> = insightFacade.addDataset(id, datasets[id],
            InsightDatasetKind.Courses).then(() => insightFacade.removeDataset(id));
        return expect(futureResult).to.eventually.deep.equal(id);
    });

    it("Should not remove a dataset with a whitespace id", function () {
        const futureResult: Promise<string> = insightFacade.removeDataset(" ");
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not remove a dataset with an underscore in the id", function () {
        const futureResult: Promise<string> = insightFacade.removeDataset("_courses");
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should not remove a dataset that has not been added", function () {
        const futureResult: Promise<string> = insightFacade.removeDataset("courses");
        return expect(futureResult).to.be.rejectedWith(NotFoundError);
    });

    it("Successfully removeDataset", function () {
        const id: string = "simpleCourses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(["simpleCourses"]).then(() => {
            const secFutureResult = insightFacade.addDataset(
                "test2",
                datasets["test2"],
                InsightDatasetKind.Courses
            );
            return expect(secFutureResult).to.eventually.deep.equal(["simpleCourses", "test2"]).then(() => {
                const res = insightFacade.removeDataset("test2");
                return expect(res).to.eventually.deep.equal("test2");
            });
        });
    });

    it("Try to remove a dataset with invalid id, insight error", function () {
        const id: string = " ";
        const futureResult: Promise<string> = insightFacade.removeDataset(
            id
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Try to remove a dataset with underscore id, insight error", function () {
        const id: string = "cours_es";
        const futureResult: Promise<string> = insightFacade.removeDataset(
            id
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("addDataset then try to delete a dataset with invalid id, insight error", function () {
        const id: string = "simpleCourses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(["simpleCourses"]).then(() => {
            const secFutureResult = insightFacade.addDataset(
                "test2",
                datasets["test2"],
                InsightDatasetKind.Courses
            );
            return expect(secFutureResult).to.eventually.deep.equal(["simpleCourses", "test2"]).then(() => {
                const thirdFutRes: Promise<string> = insightFacade.removeDataset(" ");
                return expect(thirdFutRes).to.be.rejectedWith(InsightError);
            });
        });
    });

    it("Try to remove an dataset with a non existing id, not found error", function () {
        const id: string = "world";
        const futureResult: Promise<string> = insightFacade.removeDataset(
            id
        );
        return expect(futureResult).to.be.rejectedWith(NotFoundError);
    });

    it("Add dataset, then try to remove a dataset with non existing id, not found error", function () {
        const id: string = "test2";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            const thirdFutRes: Promise<string> = insightFacade.removeDataset("world");
            return expect(thirdFutRes).to.be.rejectedWith(NotFoundError);
        });
    });

    it("Add dataset, then try to remove a dataset with invalid id, insight error", function () {
        const id: string = "test2";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            const thirdFutRes: Promise<string> = insightFacade.removeDataset(" ");
            return expect(thirdFutRes).to.be.rejectedWith(InsightError);
        });
    });

    // listDatasets

    it("Should list an empty array", function () {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should list an array of valid datasets", function () {
        const id: string = "courses";
        const expectedDataSet: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        const expectedArray: InsightDataset[] = [expectedDataSet];
        const futureResult: Promise<InsightDataset[]> = insightFacade.addDataset(id,
            datasets[id], InsightDatasetKind.Courses).then(() => insightFacade.listDatasets());
        return expect(futureResult).to.eventually.deep.equal(expectedArray);
    });

    it("Should read from disk", function () {
        const expected: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        const futureResult: Promise<InsightDataset[]> = insightFacade.addDataset("courses", datasets["courses"],
            InsightDatasetKind.Courses)
            .then(() => {
                insightFacade = new InsightFacade();
                return insightFacade.listDatasets();
            });

        return expect(futureResult).to.eventually.deep.equal([expected]);
    });

    it("Should update array after adding a second dataset", function () {
        const dataSet1: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        const dataSet2: InsightDataset = {
            id: "simpleCourses",
            kind: InsightDatasetKind.Courses,
            numRows: 186
        };
        const expectedArray: InsightDataset[] = [dataSet1, dataSet2];
        const futureResult: Promise<InsightDataset[]> = insightFacade.addDataset(dataSet1.id,
            datasets[dataSet1.id], InsightDatasetKind.Courses).then(() => insightFacade.addDataset(dataSet2.id,
            datasets[dataSet2.id], InsightDatasetKind.Courses)).then(() => insightFacade.listDatasets());
        return expect(futureResult).to.eventually.deep.equal(expectedArray);

    });

    it("Should update array after removing a dataset", function () {
        const dataSet1: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        const dataSet2: InsightDataset = {
            id: "simpleCourses",
            kind: InsightDatasetKind.Courses,
            numRows: 186
        };
        const expectedArray: InsightDataset[] = [dataSet1, dataSet2];
        const futureResult: Promise<InsightDataset[]> = insightFacade.addDataset(dataSet1.id,
            datasets[dataSet1.id], InsightDatasetKind.Courses)
            .then(() => insightFacade.addDataset(dataSet2.id,
                datasets[dataSet2.id], InsightDatasetKind.Courses))
            .then(() => insightFacade.listDatasets());
        return expect(futureResult).to.eventually.deep.equal(expectedArray);

    });

    it("Should have same dataset array after removing an invalid dataset", function () {
        const dataSet1: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        const expectedArray: InsightDataset[] = [dataSet1];

        const futureResult: Promise<any> =
            insightFacade.addDataset(dataSet1.id, datasets[dataSet1.id], InsightDatasetKind.Courses)
                .then(() => {
                    return insightFacade.removeDataset("invalid id")
                    .catch(() => insightFacade.listDatasets());
                });
        return expect(futureResult).to.eventually.deep.equal(expectedArray);
    });

    it("Should have return the id of the dataset removed", function () {
        const dataSet1: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        let futureResult: Promise<string> = insightFacade.addDataset(dataSet1.id,
            datasets[dataSet1.id], InsightDatasetKind.Courses)
            .then(() => futureResult = insightFacade.removeDataset(dataSet1.id));
        return expect(futureResult).to.eventually.deep.equal(dataSet1.id);

    });

    it("call listDatasets on no dataset", function () {
        const res: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(res).to.eventually.deep.equal([]);
    });

    it("Should add a valid dataset and then test listDatasets", function () {
        const id: string = "courses";
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        ).then(() => {
            const dataset1: InsightDataset = {
                id: "courses",
                kind: InsightDatasetKind.Courses,
                numRows: 64612
            };
            return insightFacade.listDatasets()
                .then((res: InsightDataset[]) => {
                    return expect(res).to.deep.include(dataset1);
                });
        });
    });

    it("Successfully return list of 2 datasets", function () {
        const firstId: string = "courses";
        const secondId: string = "test2";
        const dataset1: InsightDataset = {
            id: "courses",
            kind: InsightDatasetKind.Courses,
            numRows: 64612
        };
        const dataset2: InsightDataset = {
            id: "test2",
            kind: InsightDatasetKind.Courses,
            numRows: 36
        };
        return insightFacade.addDataset(firstId, datasets[firstId], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.addDataset(secondId, datasets[secondId], InsightDatasetKind.Courses);
            })
            .then(() => {
                return insightFacade.listDatasets();
            })
            .then((res: InsightDataset[]) => {
                return expect(res).to.deep.include(dataset1) && expect(res).to.deep.include(dataset2);
            });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */

describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = { courses: { path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
          rooms: { path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];
    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        this.timeout(10000);
        Log.test(`Before: ${this.test.parent.title}`);
        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }
        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises);
    });
    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
