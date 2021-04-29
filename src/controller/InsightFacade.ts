import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError,
} from "./IInsightFacade";
import * as fs from "fs-extra";
import {checkQuery, extractIDinWhere, tranExist} from "./checkQuery_Body";
import {extractColumn, orderID, readID} from "./checkQuery_Options";
import {parseQuery} from "./parseQuery";
import {parseBuildings, parseCoursesAndAdd, loopTree} from "./parseAdd";
import {groupID} from "./checkQuery_Transformation";

const JSZip = require("jszip");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public dataStructure: Map<string, any>;
    public listData: Map<string, any>;
    public cacheDir = "./data/";

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.dataStructure = new Map<string, any>();
        this.listData = new Map<string, any>();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let promises: Array<Promise<string>> = [];
        let objList: any = []; // List of the filter
        let object1: any = {};
        let that = this;
        if (this.notValid(kind, id, content)) {
            return Promise.reject(new InsightError("base case error"));
        }
        if (!this.checkIfDataExistInDisk(id)) {
            return Promise.reject((new InsightError("ID existed in disk")));
        }
        if (kind === InsightDatasetKind.Courses) {
            return this.getCoursePromise(content, that, promises, id, objList, kind);
        } else {
            return this.getRoomPromise(content, id, object1, objList, that, kind);
        }
    }

    private getCoursePromise(content: string, that: this, promises: Array<Promise<string>>,
                             id: string, objList: any, kind: InsightDatasetKind.Courses): Promise<string[]> {
        return new Promise(function (resolve, reject) {
            let fetchData: any; // get data from the file
            JSZip.loadAsync(content, {base64: true}).then(function (zip: any) {
                zip.folder("courses").forEach(function (relativePath: string, file: any) {
                    that.checkJSON(relativePath, promises, file);
                });
                Promise.all(promises).then((courses) => {
                    if (courses.length === 0) {
                        reject(new InsightError("empty zip"));
                    }
                    let numRows = parseCoursesAndAdd(courses, fetchData, id, objList);
                    that.storeList(numRows, id, kind);
                }).then(() => {
                    return that.savetoDisk(id, objList, reject, resolve);
                }).catch(() => {
                    return reject(new InsightError("empty section"));
                });
            }).catch(() => {
                return reject(new InsightError("error"));
            });
        });
    }

    private getRoomPromise(content: string, id: string, object1: any, objList: any,
                           that: this, kind: InsightDatasetKind.Rooms): Promise<string[]> {
        return new Promise(function (resolve, reject) {
            // Log.trace("handle rooms in main");
            JSZip.loadAsync(content, {base64: true}).then(function (zip: any) {
                let folder = zip.folder("rooms");
                Log.trace("before index.htm");
                try {
                    folder.file("index.htm").async("string").then(function (tree: any) {
                        return parseBuildings(id, content, tree, zip);
                    }).then((table: any) => {
                        return loopTree(id, table, object1, zip, objList);
                    }).then((rooms: any) => {
                        objList = rooms;
                        objList = that.removeUndefined(objList);
                        // Log.trace(objList);
                        if (objList.length === 0 || objList === undefined) {
                            return reject(new InsightError("error"));
                        }
                        objList = objList.flat();
                        let numRows = objList.length;
                        Log.trace("Number of rooms: " + numRows);
                        that.storeList(numRows, id, kind);
                        // that.listData.set(id, [objList.length, kind]);
                    }).then(() => {
                        return that.savetoDisk(id, objList, reject, resolve);
                    }).catch((e: any) => {
                        return reject(new InsightError(e));
                    });
                } catch (err) {
                    Log.trace(err);
                    return reject(new InsightError(err));
                }
            }).catch(() => {
                return reject(new InsightError("error"));
            });
        });
    }

    public removeUndefined(objList: any): any {
        // Log.trace("removeUndefined");
        return objList.filter((element: any) => {
            return element !== undefined;
        });
    }

    private storeList(numRows: number, id: string, kind: InsightDatasetKind) {
        if (numRows === 0) {
            throw new InsightError("error, no content or dataset already in disk");
        }
        if (numRows > 0) {
            this.listData.set(id, [numRows, kind]);
        }
    }

    private savetoDisk(id: string, objList: any, reject: (reason?: any) =>
        void,          resolve: (value?: (PromiseLike<string[]> | string[])) => void) {
        this.dataStructure.set(id, objList); // data references our Map datastructure
        try {
            fs.writeFileSync(this.cacheDir + id, JSON.stringify(objList));
            // Log.trace(that.cacheDir + id);
        } catch (error) {
            // Log.trace(error);
            reject(new InsightError("unable to write to disk"));
        }
        let keys: any = Array.from(this.dataStructure.keys());
        // Log.trace(keys);
        return resolve(keys);
    }

    private checkJSON(relativePath: string, promises: Array<Promise<string>>, file: any) {
        // Only accept Json file
        if (relativePath.slice((Math.max(0, relativePath.lastIndexOf(".")) || Infinity) + 1) === "") {
            promises.push(file.async("string"));
        }
    }

    private notValid(kind: InsightDatasetKind, id: string, content: string) {
        return kind === null || this.dataStructure.has(id) || id === null
            || id === " " || id === "" || id.includes("_") || id === undefined || kind === undefined
            || id.trim() === "" || id.length === 0 || content === null || content === undefined
            || typeof id !== "string" || typeof content !== "string" || ((kind !== InsightDatasetKind.Courses)
                && (kind !== InsightDatasetKind.Rooms));
    }

    // check if id exist in disk, and make sure ./data is there
    public checkIfDataExistInDisk(id: any): boolean {
        const exist: boolean = fs.existsSync("./data/" + id);
        // Log.trace("exist: " + exist);
        if (exist) {
            return false;
        }
        if (!(fs.existsSync("./data/"))) {
            fs.mkdirSync("./data/");
        }
        return true;
    }

    public removeDataset(id: string): Promise<string> {
        let that = this;
        // const fss = require("fs");
        let path = "./data/" + id;
        const exist: boolean = fs.existsSync("./data/" + id);
        if (id === null || id === " " || id.includes("_") || id === undefined || id === "") {
            return Promise.reject(new InsightError("base case error"));
        }
        if (!that.dataStructure.has(id) || !exist) {
            return Promise.reject((new NotFoundError("ID not exist")));
        }
        return new Promise(function (resolve: any, reject: any) {
            fs.access("./data/" + id, fs.constants.F_OK || fs.constants.W_OK, function (err: any) {
                if (!err && exist) {
                    fs.unlink(path, (error: any) => {
                        if (error) {
                            Log.trace(err);
                            return reject(new InsightError("error"));
                        }
                        that.dataStructure.delete(id); // memory caches
                        that.listData.delete(id);
                        return resolve(id);
                    });
                } else {
                    return reject(new InsightError("error"));
                }
            });
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let that = this;
        return new Promise(function (resolve, reject) {
            // that.listData.set(id, [numRows, kind]);
            let keys = Array.from(that.listData.keys());
            let values = Array.from(that.listData.values());
            // Log.trace(keys);
            // Log.trace(values);
            let dataset: InsightDataset[] = [];
            for (let i = 0; i < keys.length; i++) {
                dataset[i] = {
                    id: keys[i],
                    kind: values[i][1],
                    numRows: values[i][0],
                };
                Log.trace(dataset[i].id + " " + dataset[i].kind + " " + dataset[i].numRows);
            }
            Log.trace(dataset);
            resolve(dataset);
        });
    }

    public performQuery(query: any): Promise<any[]> {
        // Log.trace(query);
        let that = this;
        let CoursesAdded: string[] = [];
        return new Promise(function (resolve, reject) {
            fs.readdirSync("./data/").forEach(function (file: any) {
                CoursesAdded.push(file);
                Log.trace("find the file: " + file);
            });
            if (query === null || query === undefined) {
                return reject(new InsightError("Query can not be null or undefined"));
            }
            if (!checkQuery(query)) {
                return reject(new InsightError("Not a valid query"));
            }
            // Get data from checkQuery file
            let sorting: any = orderID;
            let extractCol: any = extractColumn;
            let readid: any = readID; // null mean it's apply key
            let whereid: any = extractIDinWhere;
            let gpid: any = groupID;
            // Log.trace("123");
            if (readid !== null && whereid !== "" && readid !== whereid) {
                return reject(new InsightError("readid !== whereid"));
            }
            if (whereid !== "" && whereid !== groupID && tranExist) {
                return reject(new InsightError("whereid !== groupID"));
            }
            if (readid === null && tranExist) {
                readid = gpid;
            }
            if (!CoursesAdded.includes(readid)) {
                return reject(new InsightError("No such id: " + CoursesAdded + " in file"));
            }
            // if (CoursesAdded.length === 0 || that.dataStructure.size === 0) {
            if (CoursesAdded.length === 0) {
                reject(new InsightError("no dataset in disk or memory"));
            } else {
                try {
                    let fileread = fs.readFileSync(that.cacheDir + readid, "utf8");
                    let stringread = JSON.parse(fileread);
                    // Log.trace("Stringread after JSON parse");
                    // Log.trace(stringread);
                    let result: any[] = parseQuery(query, stringread, sorting, extractCol, readid);
                    // Log.trace("result length: " + result.length);
                    if (result.length < 5000) {
                        return resolve(result);
                    } else {
                        return reject(new ResultTooLargeError("There are > 5000 results"));
                    }
                } catch (err) {
                    // Log.trace(typeof err);
                    // if (err instanceof ResultTooLargeError) {
                    //     // Log.trace("didn't catch");
                    //     return reject(new ResultTooLargeError("There are > 5000 results"));
                    // }
                    // Log.trace(err);
                    return reject(new InsightError("file reading error"));
                    // Log.trace("didn't catch");
                }
            }
        });
        return Promise.reject("Not implemented.");
    }
}
