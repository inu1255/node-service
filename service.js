const path = require("path");
const fs = require("fs");
/**
 * @param {string} script
 * @param {string} name
 * @param {string} description
 */
function createService(script, name, description) {
	let config = {
		name,
		description,
		script,
		wait: 1,
		grow: 0.25,
		maxRestarts: 40,
	};
	if (process.platform == "win32") {
		if (script.indexOf(":") < 0) script = path.join(process.cwd(), script);
	} else {
		if (script[0] != "/") script = path.join(process.cwd(), script);
	}
	if (!fs.existsSync(script)) throw new Error(`script not exists: ${script}`);
	if (process.platform == "win32") {
		if (script.indexOf(":") < 0) script = path.join(process.cwd(), script);
		const {Service} = require("node-windows");
		return new Service(config);
	}
	if (process.platform == "darwin") {
		const {Service} = require("node-mac");
		return new Service(config);
	}
	const {Service} = require("node-linux");
	return new Service(config);
}

class Service {
	/**
	 * @param {string} script
	 * @param {string} name
	 * @param {string} description
	 */
	constructor(script, name, description) {
		this.svc = createService(script, name, description);
		let events = ["install", "alreadyinstalled", "invalidinstallation", "uninstall", "alreadyuninstalled", "start", "stop", "error"];
		for (let event of events) {
			var that = this;
			this.svc.on(event, function (e) {
				let key = "_" + event;
				if (that[key]) {
					that[key](e);
					delete that[key];
				}
			});
		}
	}
	status() {
		let {id, name, description, script, logpath, exists} = this.svc;
		console.log(JSON.stringify({id, name, description, script, logpath, exists}, null, 2));
	}
	install() {
		var that = this;
		return new Promise(function (resolve, reject) {
			if (that.svc.exists) return resolve();
			that._install = resolve;
			that._alreadyinstalled = resolve;
			that._error = reject;
			that._invalidinstallation = reject;
			that.svc.install();
		});
	}
	uninstall() {
		var that = this;
		return new Promise(function (resolve, reject) {
			if (!that.svc.exists) return resolve();
			that._error = reject;
			that._uninstall = resolve;
			that.svc.uninstall();
		});
	}
	reinstall() {
		var that = this;
		return that.uninstall().then(function () {
			return that.start();
		});
	}
	start() {
		var that = this;
		if (!that.svc.exists) return this.install().then(() => this.start());
		return new Promise(function (resolve, reject) {
			that._error = reject;
			that._start = resolve;
			that.svc.start();
		});
	}
	stop() {
		var that = this;
		return new Promise(function (resolve, reject) {
			if (!that.svc.exists) return resolve();
			that._error = reject;
			that._stop = resolve;
			that.svc.stop();
		});
	}
	restart() {
		var that = this;
		return that.stop().then(function () {
			return that.start();
		});
	}
}

module.exports = Service;
