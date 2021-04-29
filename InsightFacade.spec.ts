import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        emptysection: "./test/data/emptysection.zip",
        notcourses: "./test/data/notcourses.zip",
        image: "./test/data/image.jpg",
        notjson: "./test/data/notjson.zip",
        empty: "./test/data/empty.zip",
        valid1: "./test/data/valid1.zip",
        oneinvalidfile: "./test/data/oneinvalidfile.zip",
        rooms: "./test/data/rooms.zip"
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
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
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

    // 1. This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // addDataset testing
    // 2. add already exist dataset
    it("Should not add a dataset (already exist)", function () {
        const id: string = "courses";
        const expected1: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            return expect(futureResult).to.be.rejectedWith(InsightError);
        });
    });

    // 3. empty section
    it("Should not add a valid dataset (empty section)", function () {
        const id: string = "emptysection";
        // const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // // 4. image
    // it("Should not add a valid dataset (image)", function () {
    //     const id: string = "image";
    //     // const expected: string[] = [id];
    // const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     return expect(futureResult).to.be.rejectedWith(InsightError);
    // });

    // 5. empty zip
    it("Should not add a valid dataset (empty zip)", function () {
        const id: string = "empty";
        // const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // 6. valid1.zip
    it("Should add a valid dataset (valid1 zip)", function () {
        const id: string = "valid1";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // 7. not courses.zip
    it("Should not add a valid dataset (not courses.zip)", function () {
        const id: string = "notcourses";
        // const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // 8. not json
    it("Should not add a valid dataset (not json)", function () {
        const id: string = "notjson";
        // const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // 9. whitespace
    it("Should not add a valid dataset (whitespace)", function () {
        const id: string = " ";
        // const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // 10. contain underscore
    it("Should not add a invalid dataset (contain underscore)", function () {
        const id: string = "courses";
        // const expected: string[] = [id];
        const id1: string = "_123";
        const id2: string = "123_";
        const id3: string = "_";
        const id4: string = " _";
        let futureResult: Promise<string[]> = insightFacade.addDataset(id1, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
            futureResult = insightFacade.addDataset(id2, datasets[id], InsightDatasetKind.Courses);
            return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
                futureResult = insightFacade.addDataset(id3, datasets[id], InsightDatasetKind.Courses);
                return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
                    futureResult = insightFacade.addDataset(id4, datasets[id], InsightDatasetKind.Courses);
                    return expect(futureResult).to.be.rejectedWith(InsightError);
                });
            });
        });

        // return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
        //     futureResult = insightFacade.addDataset(id2, datasets[id], InsightDatasetKind.Courses);
        //     return expect(futureResult).to.be.rejectedWith(InsightError);
        // }).then(() => {
        //     futureResult = insightFacade.addDataset(id3, datasets[id], InsightDatasetKind.Courses);
        //     return expect(futureResult).to.be.rejectedWith(InsightError);
        // }).then( () => {
        //     futureResult = insightFacade.addDataset(id4, datasets[id], InsightDatasetKind.Courses);
        //     return expect(futureResult).to.be.rejectedWith(InsightError);
        // });
    });

    // 11. add two valid dataset. need check
    it("Should add a valid dataset (two valid zip)", function () {
        const id1: string = "valid1";
        const id2: string = "courses";
        const expected1: string[] = [id1];
        const expected2: string[] = [id1, id2];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult = insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            return expect(futureResult).to.eventually.have.members(expected2).and.to.have.length(expected2.length);
        });
    });
    // 12. add one zip file that contain one invalid file
    it("Should add a valid dataset (two valid zip)", function () {
        const id1: string = "oneinvalidfile";
        const expected1: string[] = [id1];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected1);
    });

    it("Should not add a invalid dataset rooms kind", function () {
        const id1: string = "rooms";
        // const expected1: string[] = [id1];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // removeDataset
    // 13. not exist
    it("Should not remove dataset (Not exist)", function () {
        const id: string = "courses";
        // const expected: string[] = [id];
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(NotFoundError);
    });

    // 14. invalid id, underscore
    it("Should not remove dataset (invalid id, underscore)", function () {
        // const expected: string[] = [id];
        const id1: string = "_123";
        const id2: string = "123_";
        const id3: string = "_";
        const id4: string = " _";
        let futureResult: Promise<string> = insightFacade.removeDataset(id1);
        return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
            futureResult = insightFacade.removeDataset(id2);
            return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
                futureResult = insightFacade.removeDataset(id3);
                return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
                    futureResult = insightFacade.removeDataset(id4);
                    return expect(futureResult).to.be.rejectedWith(InsightError);
                });
            });
        });
    });

    // 15. invalid id, whitespace
    it("Should not remove dataset (invalid id, whitespace)", function () {
        const id: string = " ";
        // const expected: string[] = [id];
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // 16. valid id remove
    it("Should remove valid id", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        let futureResult2: Promise<string>;
        return expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            futureResult2 = insightFacade.removeDataset(id);
            return expect(futureResult2).to.eventually.deep.equal(id);
        });
    });

    // listDatasets
    // 17. Add one and List one
    it("Add one and List one", function () {
        const id: string = "courses";
        const expected1: string[] = [id];
        const expected2: InsightDataset[] = [];
        expected2[0] = {id: id, kind: InsightDatasetKind.Courses, numRows: 64612};
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        let futureResult2: Promise<InsightDataset[]>;
        return expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult2 = insightFacade.listDatasets();
            return expect(futureResult2).to.have.deep.members(expected2);
        });
    });
    // 18. Add one, remove one and list it(empty)
    it("Add one, remove one and list it (empty)", function () {
        const id: string = "courses";
        const expected1: string[] = [id];
        const expected2: InsightDataset[] = [];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        let futureResult2: Promise<InsightDataset[]>;
        let futureResult3: Promise<string>;
        return expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult3 = insightFacade.removeDataset(id);
            return expect(futureResult2).to.eventually.deep.equal(id).then(() => {
                futureResult2 = insightFacade.listDatasets();
                return expect(futureResult2).to.have.deep.members(expected2);
            });
        });
    });

    // 19. Add two, remove one and list it (one)
    it("Add two, remove one and list it (empty)", function () {
        const id: string = "courses";
        const id2: string = "courses2";
        const expected1: string[] = [id];
        const expected2: string[] = [id, id2];
        const expected3: InsightDataset[] = [];
        expected3[0] = {id: id, kind: InsightDatasetKind.Courses, numRows: 64612};
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        let futureResult2: Promise<InsightDataset[]>;
        let futureResult3: Promise<string>;
        return expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult = insightFacade.addDataset(id2, datasets[id], InsightDatasetKind.Courses);
            return expect(futureResult).to.have.deep.members(expected2).and.to.have.length(expected2.length);
        }).then(() => {
            futureResult3 = insightFacade.removeDataset(id2);
            return expect(futureResult3).to.eventually.deep.equal(id2);
        }).then(() => {
            futureResult2 = insightFacade.listDatasets();
            return expect(futureResult2).to.have.deep.members(expected3).and.to.have.length(expected3.length);
        });
    });

    // 20. List Empty
    it("List Empty list", function () {
        const expected2: InsightDataset[] = [];
        let futureResult2: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult2).to.eventually.deep.equal(expected2);
    });

    // 21. add one zip file that contain one invalid file, list it
    it("Should add a valid dataset (two valid zip)", function () {
        const id1: string = "oneinvalidfile";
        const expected1: string[] = [id1];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
        const expected3: InsightDataset[] = [];
        let futureResult2: Promise<InsightDataset[]>;
        expected3[0] = {id: id1, kind: InsightDatasetKind.Courses, numRows: 64612};
        return expect(futureResult).to.eventually.deep.equal(expected1).then( () => {
            futureResult2 = insightFacade.listDatasets();
            return expect(futureResult2).to.have.deep.members(expected3).and.to.have.length(expected3.length);
        });
    });

});
/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: {path: string, kind: InsightDatasetKind} } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
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
                    // return InsightError;
                });
            }
        });
    });
});
