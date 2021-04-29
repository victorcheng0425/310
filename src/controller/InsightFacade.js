"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const fs = require("fs-extra");
const checkQuery_Body_1 = require("./checkQuery_Body");
const checkQuery_Options_1 = require("./checkQuery_Options");
const parseQuery_1 = require("./parseQuery");
const parseAdd_1 = require("./parseAdd");
const checkQuery_Transformation_1 = require("./checkQuery_Transformation");
const JSZip = require("jszip");
class InsightFacade {
    constructor() {
        this.cacheDir = "./data/";
        Util_1.default.trace("InsightFacadeImpl::init()");
        this.dataStructure = new Map();
        this.listData = new Map();
    }
    addDataset(id, content, kind) {
        let promises = [];
        let objList = [];
        let object1 = {};
        let that = this;
        if (this.notValid(kind, id, content)) {
            return Promise.reject(new IInsightFacade_1.InsightError("base case error"));
        }
        if (!this.checkIfDataExistInDisk(id)) {
            return Promise.reject((new IInsightFacade_1.InsightError("ID existed in disk")));
        }
        if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
            return this.getCoursePromise(content, that, promises, id, objList, kind);
        }
        else {
            return this.getRoomPromise(content, id, object1, objList, that, kind);
        }
    }
    getCoursePromise(content, that, promises, id, objList, kind) {
        return new Promise(function (resolve, reject) {
            let fetchData;
            JSZip.loadAsync(content, { base64: true }).then(function (zip) {
                zip.folder("courses").forEach(function (relativePath, file) {
                    that.checkJSON(relativePath, promises, file);
                });
                Promise.all(promises).then((courses) => {
                    if (courses.length === 0) {
                        reject(new IInsightFacade_1.InsightError("empty zip"));
                    }
                    let numRows = parseAdd_1.parseCoursesAndAdd(courses, fetchData, id, objList);
                    that.storeList(numRows, id, kind);
                }).then(() => {
                    return that.savetoDisk(id, objList, reject, resolve);
                }).catch(() => {
                    return reject(new IInsightFacade_1.InsightError("empty section"));
                });
            }).catch(() => {
                return reject(new IInsightFacade_1.InsightError("error"));
            });
        });
    }
    getRoomPromise(content, id, object1, objList, that, kind) {
        return new Promise(function (resolve, reject) {
            JSZip.loadAsync(content, { base64: true }).then(function (zip) {
                let folder = zip.folder("rooms");
                Util_1.default.trace("before index.htm");
                try {
                    folder.file("index.htm").async("string").then(function (tree) {
                        return parseAdd_1.parseBuildings(id, content, tree, zip);
                    }).then((table) => {
                        return parseAdd_1.loopTree(id, table, object1, zip, objList);
                    }).then((rooms) => {
                        objList = rooms;
                        objList = that.removeUndefined(objList);
                        if (objList.length === 0 || objList === undefined) {
                            return reject(new IInsightFacade_1.InsightError("error"));
                        }
                        objList = objList.flat();
                        let numRows = objList.length;
                        Util_1.default.trace("Number of rooms: " + numRows);
                        that.storeList(numRows, id, kind);
                    }).then(() => {
                        return that.savetoDisk(id, objList, reject, resolve);
                    }).catch((e) => {
                        return reject(new IInsightFacade_1.InsightError(e));
                    });
                }
                catch (err) {
                    Util_1.default.trace(err);
                    return reject(new IInsightFacade_1.InsightError(err));
                }
            }).catch(() => {
                return reject(new IInsightFacade_1.InsightError("error"));
            });
        });
    }
    removeUndefined(objList) {
        return objList.filter((element) => {
            return element !== undefined;
        });
    }
    storeList(numRows, id, kind) {
        if (numRows === 0) {
            throw new IInsightFacade_1.InsightError("error, no content or dataset already in disk");
        }
        if (numRows > 0) {
            this.listData.set(id, [numRows, kind]);
        }
    }
    savetoDisk(id, objList, reject, resolve) {
        this.dataStructure.set(id, objList);
        try {
            fs.writeFileSync(this.cacheDir + id, JSON.stringify(objList));
        }
        catch (error) {
            reject(new IInsightFacade_1.InsightError("unable to write to disk"));
        }
        let keys = Array.from(this.dataStructure.keys());
        return resolve(keys);
    }
    checkJSON(relativePath, promises, file) {
        if (relativePath.slice((Math.max(0, relativePath.lastIndexOf(".")) || Infinity) + 1) === "") {
            promises.push(file.async("string"));
        }
    }
    notValid(kind, id, content) {
        return kind === null || this.dataStructure.has(id) || id === null
            || id === " " || id === "" || id.includes("_") || id === undefined || kind === undefined
            || id.trim() === "" || id.length === 0 || content === null || content === undefined
            || typeof id !== "string" || typeof content !== "string" || ((kind !== IInsightFacade_1.InsightDatasetKind.Courses)
            && (kind !== IInsightFacade_1.InsightDatasetKind.Rooms));
    }
    checkIfDataExistInDisk(id) {
        const exist = fs.existsSync("./data/" + id);
        if (exist) {
            return false;
        }
        if (!(fs.existsSync("./data/"))) {
            fs.mkdirSync("./data/");
        }
        return true;
    }
    removeDataset(id) {
        let that = this;
        let path = "./data/" + id;
        const exist = fs.existsSync("./data/" + id);
        if (id === null || id === " " || id.includes("_") || id === undefined || id === "") {
            return Promise.reject(new IInsightFacade_1.InsightError("base case error"));
        }
        if (!that.dataStructure.has(id) || !exist) {
            return Promise.reject((new IInsightFacade_1.NotFoundError("ID not exist")));
        }
        return new Promise(function (resolve, reject) {
            fs.access("./data/" + id, fs.constants.F_OK || fs.constants.W_OK, function (err) {
                if (!err && exist) {
                    fs.unlink(path, (error) => {
                        if (error) {
                            Util_1.default.trace(err);
                            return reject(new IInsightFacade_1.InsightError("error"));
                        }
                        that.dataStructure.delete(id);
                        that.listData.delete(id);
                        return resolve(id);
                    });
                }
                else {
                    return reject(new IInsightFacade_1.InsightError("error"));
                }
            });
        });
    }
    listDatasets() {
        let that = this;
        return new Promise(function (resolve, reject) {
            let keys = Array.from(that.listData.keys());
            let values = Array.from(that.listData.values());
            let dataset = [];
            for (let i = 0; i < keys.length; i++) {
                dataset[i] = {
                    id: keys[i],
                    kind: values[i][1],
                    numRows: values[i][0],
                };
                Util_1.default.trace(dataset[i].id + " " + dataset[i].kind + " " + dataset[i].numRows);
            }
            Util_1.default.trace(dataset);
            resolve(dataset);
        });
    }
    performQuery(query) {
        let that = this;
        let CoursesAdded = [];
        return new Promise(function (resolve, reject) {
            fs.readdirSync("./data/").forEach(function (file) {
                CoursesAdded.push(file);
                Util_1.default.trace("find the file: " + file);
            });
            if (query === null || query === undefined) {
                return reject(new IInsightFacade_1.InsightError("Query can not be null or undefined"));
            }
            if (!checkQuery_Body_1.checkQuery(query)) {
                return reject(new IInsightFacade_1.InsightError("Not a valid query"));
            }
            let sorting = checkQuery_Options_1.orderID;
            let extractCol = checkQuery_Options_1.extractColumn;
            let readid = checkQuery_Options_1.readID;
            let whereid = checkQuery_Body_1.extractIDinWhere;
            let gpid = checkQuery_Transformation_1.groupID;
            if (readid !== null && whereid !== "" && readid !== whereid) {
                return reject(new IInsightFacade_1.InsightError("readid !== whereid"));
            }
            if (whereid !== "" && whereid !== checkQuery_Transformation_1.groupID && checkQuery_Body_1.tranExist) {
                return reject(new IInsightFacade_1.InsightError("whereid !== groupID"));
            }
            if (readid === null && checkQuery_Body_1.tranExist) {
                readid = gpid;
            }
            if (!CoursesAdded.includes(readid)) {
                return reject(new IInsightFacade_1.InsightError("No such id: " + CoursesAdded + " in file"));
            }
            if (CoursesAdded.length === 0) {
                reject(new IInsightFacade_1.InsightError("no dataset in disk or memory"));
            }
            else {
                try {
                    let fileread = fs.readFileSync(that.cacheDir + readid, "utf8");
                    let stringread = JSON.parse(fileread);
                    let result = parseQuery_1.parseQuery(query, stringread, sorting, extractCol, readid);
                    if (result.length < 5000) {
                        return resolve(result);
                    }
                    else {
                        return reject(new IInsightFacade_1.ResultTooLargeError("There are > 5000 results"));
                    }
                }
                catch (err) {
                    return reject(new IInsightFacade_1.InsightError("file reading error"));
                }
            }
        });
        return Promise.reject("Not implemented.");
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map