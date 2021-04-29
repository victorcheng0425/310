"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai = require("chai");
const fs = require("fs-extra");
const chaiAsPromised = require("chai-as-promised");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
chai.use(chaiAsPromised);
describe("InsightFacade Add/Remove/List Dataset", function () {
    const datasetsToLoad = {
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
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    it("Should add a valid dataset", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should not add a dataset (already exist)", function () {
        const id = "courses";
        const expected1 = [id];
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    it("Should not add a valid dataset (empty section)", function () {
        const id = "emptysection";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not add a valid dataset (empty zip)", function () {
        const id = "empty";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should add a valid dataset (valid1 zip)", function () {
        const id = "valid1";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should not add a valid dataset (not courses.zip)", function () {
        const id = "notcourses";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not add a valid dataset (not json)", function () {
        const id = "notjson";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not add a valid dataset (whitespace)", function () {
        const id = " ";
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not add a invalid dataset (contain underscore)", function () {
        const id = "courses";
        const id1 = "_123";
        const id2 = "123_";
        const id3 = "_";
        const id4 = " _";
        let futureResult = insightFacade.addDataset(id1, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError).then(() => {
            futureResult = insightFacade.addDataset(id2, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError).then(() => {
                futureResult = insightFacade.addDataset(id3, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
                return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError).then(() => {
                    futureResult = insightFacade.addDataset(id4, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
                    return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
                });
            });
        });
    });
    it("Should add a valid dataset (two valid zip)", function () {
        const id1 = "valid1";
        const id2 = "courses";
        const expected1 = [id1];
        const expected2 = [id1, id2];
        let futureResult = insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult = insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult).to.eventually.have.members(expected2).and.to.have.length(expected2.length);
        });
    });
    it("Should add a valid dataset (two valid zip)", function () {
        const id1 = "oneinvalidfile";
        const expected1 = [id1];
        let futureResult = insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1);
    });
    it("Should not add a invalid dataset rooms kind", function () {
        const id1 = "rooms";
        let futureResult = insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should not remove dataset (Not exist)", function () {
        const id = "courses";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.NotFoundError);
    });
    it("Should not remove dataset (invalid id, underscore)", function () {
        const id1 = "_123";
        const id2 = "123_";
        const id3 = "_";
        const id4 = " _";
        let futureResult = insightFacade.removeDataset(id1);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError).then(() => {
            futureResult = insightFacade.removeDataset(id2);
            return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError).then(() => {
                futureResult = insightFacade.removeDataset(id3);
                return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError).then(() => {
                    futureResult = insightFacade.removeDataset(id4);
                    return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
                });
            });
        });
    });
    it("Should not remove dataset (invalid id, whitespace)", function () {
        const id = " ";
        const futureResult = insightFacade.removeDataset(id);
        return chai_1.expect(futureResult).to.be.rejectedWith(IInsightFacade_1.InsightError);
    });
    it("Should remove valid id", function () {
        const id = "courses";
        const expected = [id];
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        let futureResult2;
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            futureResult2 = insightFacade.removeDataset(id);
            return chai_1.expect(futureResult2).to.eventually.deep.equal(id);
        });
    });
    it("Add one and List one", function () {
        const id = "courses";
        const expected1 = [id];
        const expected2 = [];
        expected2[0] = { id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 64612 };
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        let futureResult2;
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult2 = insightFacade.listDatasets();
            return chai_1.expect(futureResult2).to.have.deep.members(expected2);
        });
    });
    it("Add one, remove one and list it (empty)", function () {
        const id = "courses";
        const expected1 = [id];
        const expected2 = [];
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        let futureResult2;
        let futureResult3;
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult3 = insightFacade.removeDataset(id);
            return chai_1.expect(futureResult2).to.eventually.deep.equal(id).then(() => {
                futureResult2 = insightFacade.listDatasets();
                return chai_1.expect(futureResult2).to.have.deep.members(expected2);
            });
        });
    });
    it("Add two, remove one and list it (empty)", function () {
        const id = "courses";
        const id2 = "courses2";
        const expected1 = [id];
        const expected2 = [id, id2];
        const expected3 = [];
        expected3[0] = { id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 64612 };
        let futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        let futureResult2;
        let futureResult3;
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult = insightFacade.addDataset(id2, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult).to.have.deep.members(expected2).and.to.have.length(expected2.length);
        }).then(() => {
            futureResult3 = insightFacade.removeDataset(id2);
            return chai_1.expect(futureResult3).to.eventually.deep.equal(id2);
        }).then(() => {
            futureResult2 = insightFacade.listDatasets();
            return chai_1.expect(futureResult2).to.have.deep.members(expected3).and.to.have.length(expected3.length);
        });
    });
    it("List Empty list", function () {
        const expected2 = [];
        let futureResult2 = insightFacade.listDatasets();
        return chai_1.expect(futureResult2).to.eventually.deep.equal(expected2);
    });
    it("Should add a valid dataset (two valid zip)", function () {
        const id1 = "oneinvalidfile";
        const expected1 = [id1];
        let futureResult = insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses);
        const expected3 = [];
        let futureResult2;
        expected3[0] = { id: id1, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: 64612 };
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected1).then(() => {
            futureResult2 = insightFacade.listDatasets();
            return chai_1.expect(futureResult2).to.have.deep.members(expected3).and.to.have.length(expected3.length);
        });
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: { path: "./test/data/courses.zip", kind: IInsightFacade_1.InsightDatasetKind.Courses },
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult = insightFacade.performQuery(test.query);
                    return TestUtil_1.default.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map