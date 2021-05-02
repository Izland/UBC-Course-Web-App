import Server from "../src/rest/Server";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import { expect } from "chai";
import Log from "../src/Util";

describe("Facade D3", function () {
    let server: Server = null;
    chai.use(chaiHttp);
    before(function () {
        server = new Server(4321);
        try {
            server.start();
        } catch (error) {
            Log.trace("log error");
        }
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // Sample on how to format PUT requests

    it("invalid PUT test, id is whitespace, kind is rooms", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/ /rooms";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT test, kind is not rooms", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/rooms/room";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT test, id contains a underscore", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/rooms_/rooms";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT test, id is whitespace, kind is courses", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/ /courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT test, id contains underscore, kind is courses", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses_/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT test, kind is wrong", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/rooms/room_";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT test 3, kind is whitespace", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/rooms/ ";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT courses 1, kind is not courses", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses_";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT courses 2, kind is whitespace", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/ ";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT courses 3, zip file does not contain courses", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/NoCoursesFolder.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT courses 4, rooms zip file but wants courses", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT courses 5, file is not of type zip", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/test1.pdf");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("invalid PUT rooms 4, not a zip file, kind is rooms", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/rooms/rooms";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/test1.pdf");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    // expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect(err.status).to.be.equal(400);
        }
    });

    it("PUT test for courses dataset", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail(err);
                });
        } catch (err) {
            Log.trace("last logging");
            expect.fail();
        }
    });

    it("PUT test for courses dataset second time", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    expect.fail();
                })
                .catch(function (err) {
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("last logging");
            expect.fail();
        }
    });

    it("PUT test for rooms dataset", function () {
        const fs = require("fs");
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/rooms/rooms";
        let ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("First logging");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("last logging");
            expect.fail();
        }
    });

    // Assume there is a courses dataset currently stored in the server
    it("Post query", function () {
        const fs = require("fs");
        const path = require("path");
        let SERVER_URL = "http://localhost:4321";
        let POST_ENDPOINT_URL = "/query";
        let queryPath = path.join(__dirname, "/queries/groupByFailFindSum.json");
        let queryFile = fs.readFileSync(queryPath);
        let parsedJson = JSON.parse(queryFile);
        let query = parsedJson["query"];
        return chai.request(SERVER_URL)
            .post(POST_ENDPOINT_URL)
            .send(query)
            .set("Content-Type", "application/json")
            .then(function (res: Response) {
                Log.trace("First logging");
                expect(res.status).to.be.equal(200);
                expect(res.body.result.length).to.equal(parsedJson["result"].length);
            });

    });

    it("Post invalid query", function () {
        const fs = require("fs");
        const path = require("path");
        let SERVER_URL = "http://localhost:4321";
        let POST_ENDPOINT_URL = "/query";
        let queryPath = path.join(__dirname, "/queries/invalid.json");
        let queryFile = fs.readFileSync(queryPath);
        let parsedJson = JSON.parse(queryFile);
        let query = parsedJson["query"];
        return chai.request(SERVER_URL)
            .post(POST_ENDPOINT_URL)
            .send(query)
            .set("Content-Type", "application/json")
            .then(function (res: Response) {
                Log.trace("First logging");
            })
            .catch(function (err) {
                expect(err.status).to.be.equal(400);
            });

    });


    // Deletes courses dataset, and then attempts to delete it again which should result in a 404 error
    it("Delete dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let DEL_ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL)
                .del(DEL_ENDPOINT_URL)
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    return chai.request(SERVER_URL);
                })
                .then((chaiObject2) => {
                    chaiObject2.del(DEL_ENDPOINT_URL)
                        .then(() => {
                            expect.fail();
                        })
                        .catch((res: Response) => {
                            return expect(res.status).to.be.equal(404);
                        });
                })
                .catch(function () {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("last logging");
            expect.fail();
        }
    });

    // Assume there is a courses dataset currently stored in the server
    it("lists dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let GET_ENDPOINT_URL = "/datasets";
        try {
            return chai.request(SERVER_URL)
                .get(GET_ENDPOINT_URL)
                .then(function (res: Response) {
                    return Server.getInsightFacade().listDatasets()
                        .then((listedDatasets) => {
                            expect(res.status).to.be.equal(200);
                            return expect(res.body.result).to.deep.equal(listedDatasets);
                        });
                })
                .catch(function (err) {
                    expect.fail(err);
                });
        } catch (err) {
            Log.trace("last logging");
            expect.fail();
        }
    });

    it("should throw a 404 error", function () {
        let SERVER_URL = "http://localhost:4321";
        let GET_ENDPOINT_URL = "/dataset/notRealDataset";
        try {
            return chai.request(SERVER_URL)
                .del(GET_ENDPOINT_URL)
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    return expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace("last logging");
            expect.fail();
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
