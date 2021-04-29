"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const restify = require("restify");
const Util_1 = require("../Util");
const IInsightFacade_1 = require("../controller/IInsightFacade");
const InsightFacade_1 = require("../controller/InsightFacade");
class Server {
    constructor(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    stop() {
        Util_1.default.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }
    start() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info("Server::start() - start");
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({ mapFiles: true, mapParams: true }));
                that.rest.use(function crossOrigin(req, res, next) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "X-Requested-With");
                    return next();
                });
                that.rest.get("/echo/:msg", Server.echo);
                that.rest.put("/dataset/:id/:kind", Server.put);
                that.rest.del("/dataset/:id", Server.delete);
                that.rest.post("/query", Server.post);
                that.rest.get("/datasets", Server.get);
                that.rest.get("/.*", Server.getStatic);
                that.rest.listen(that.port, function () {
                    Util_1.default.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });
                that.rest.on("error", function (err) {
                    Util_1.default.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }
    static echo(req, res, next) {
        Util_1.default.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Util_1.default.info("Server::echo(..) - responding " + 200);
            res.json(200, { result: response });
        }
        catch (err) {
            Util_1.default.error("Server::echo(..) - responding 400");
            res.json(400, { error: err });
        }
        return next();
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    static put(req, res, next) {
        Util_1.default.trace("id: " + req.params.id);
        let id = req.params.id;
        let kind;
        if (req.params.kind === "courses") {
            kind = IInsightFacade_1.InsightDatasetKind.Courses;
        }
        else {
            kind = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        Util_1.default.trace("kind: " + kind);
        try {
            let content = Buffer.from(req.body).toString("base64");
            Server.insightFacade.addDataset(id, content, kind).then((arr) => {
                res.json(200, { result: arr });
                return next();
            }).catch((err) => {
                Util_1.default.error("catch!!, addDataset failed");
                res.json(400, { error: err.message });
                return next();
            });
        }
        catch (e) {
            Util_1.default.error("out catch");
            res.json(400, { error: e.message });
        }
        return next();
    }
    static delete(req, res, next) {
        let id = req.params.id;
        Util_1.default.trace("Id: " + id);
        try {
            Server.insightFacade.removeDataset(id).then((arr) => {
                Util_1.default.trace(arr);
                res.json(200, { result: arr });
                return next();
            }).catch((err) => {
                if (err instanceof IInsightFacade_1.InsightError) {
                    res.json(400, { error: err.message });
                    return next();
                }
                else {
                    res.json(404, { error: err.message });
                    return next();
                }
            });
        }
        catch (e) {
            Util_1.default.error(e);
            res.json(400, { error: e.message });
        }
        return next();
    }
    static post(req, res, next) {
        let query = req.body;
        try {
            Server.insightFacade.performQuery(query).then((arr) => {
                res.json(200, { result: arr });
                return next();
            }).catch((err) => {
                res.json(400, { error: err.message });
                return next();
            });
        }
        catch (e) {
            Util_1.default.error(e);
            res.json(400, { error: e.message });
        }
        return next();
    }
    static get(req, res, next) {
        try {
            Server.insightFacade.listDatasets().then((arr) => {
                res.json(200, { result: arr });
                return next();
            }).catch((err) => {
                res.json(400, { error: err.message });
                Util_1.default.error(err.message);
                return next();
            });
        }
        catch (e) {
            Util_1.default.error(e.message);
            res.json(400, { error: e.message });
        }
        return next();
    }
    static getStatic(req, res, next) {
        const publicDir = "frontend/public/";
        Util_1.default.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err, file) {
            if (err) {
                res.send(500);
                Util_1.default.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }
}
exports.default = Server;
Server.insightFacade = new InsightFacade_1.default();
//# sourceMappingURL=Server.js.map