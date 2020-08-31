#!/usr/bin/env node
const Service = require("./service");
const path = require("path");
const argv = require("yargs")
	.option("s", {
		alias: "script",
		demand: true,
		desc: "脚本文件名,不带路径",
		type: "string",
	})
	.option("n", {
		alias: "name",
		demand: true,
		desc: "服务名称",
		type: "string",
	})
	.option("d", {
		alias: "desc",
		default: "",
		desc: "服务说明",
		type: "string",
	})
	.option("p", {
		alias: "path",
		default: process.cwd(),
		defaultDescription: "当前路径",
		desc: "脚本全路径,默认当前路径",
		type: "string",
	})
	.command("install", "安装服务")
	.command("uninstall", "卸载服务")
	.command("reinstall", "重新安装服务")
	.command("start", "启动服务")
	.command("stop", "停止服务")
	.command("restart", "重启服务")
	.help("h")
	.alias("h", "help").argv;

async function run() {
	let svc = new Service(path.join(argv.p, argv.s), argv.n, argv.d);
	let key = svc[argv._[0]] ? argv._[0] : "reinstall";
	await svc[key]().then(
		() => console.log(`${key} success`),
		(e) => console.log(`${key} error: `, e)
	);
}

run();
