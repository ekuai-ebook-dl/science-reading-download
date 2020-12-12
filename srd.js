let config = {
	interval: 500,
	filenameFront: "",
	filenameBack: "",
	errMax: 3,
};//在此修改配置
let href = document.location.href;
let urlArr = href.split("/");
let ip = urlArr[2];
let hash = urlArr[4];
let div = document.createElement("div");
div.innerHTML = `
	<div  style="
		position: absolute;
	    z-index: 10001;
	    left: 0;
	    top: 0;
	    height: 600px;
	    overflow-y: scroll;
	    background-color: white;
	    max-width: 60%;">
		<input type="number" id="page-start" value="${urlArr[6]}">-<input type="number" id="page-end">
		<button onclick="getPage()">获取页面</button>
		<button onclick="downloadPage()">下载文件</button>
		<input type="checkbox" id="auto"/>自动模式
		<br/>
		<span id="size"></span>
		<br/><img id="image"  alt="" src="${href}"/>
	</div>
`;
document.body.appendChild(div);
let start = document.getElementById("page-start");
let end = document.getElementById("page-end");
let img = document.getElementById("image");
let auto = document.getElementById("auto");
let size = document.getElementById("size");
let error = 0;

function getPage() {
	let page = start.value;
	let url = `http://${ip}/asserts/${hash}/image/${page}/100?accessToken=accessToken&formMode=true`;
	let xhr = new XMLHttpRequest();
	xhr.responseType = "blob";
	xhr.onload = function () {
		if (this.status === 200) {
			let type = this.getResponseHeader("Content-Type");
			if (type.indexOf("json") !== -1) {
				console.log("加载第", page, "页", "过快，稍后重试", type);
				error++;
				if (error >= config.errMax) {
					console.error("加载第", page, "页", "重试次数超限，终止运行");
				} else {
					setTimeout(getPage, config.interval);
				}
			} else {
				error = 0;
				let blob = this.response;
				window.URL.revokeObjectURL(img.src);
				img.onload = function () {
					size.innerHTML = img.offsetWidth + "*" + img.offsetHeight;
				};
				img.src = window.URL.createObjectURL(blob);
				console.log("加载第", page, "页", "成功", type);
				if (auto.checked) {
					setTimeout(downloadPage, config.interval);
				}
			}
		} else {
			console.log("加载第", page, "页", this.status);
		}
	};
	xhr.open("GET", url);
	xhr.send();
}

function downloadPage() {
	let save_link = document.createElement("a");
	save_link.href = img.src;
	save_link.download = config.filenameFront + start.value + config.filenameBack + ".png";
	save_link.click();
	if (auto.checked && parseInt(start.value) >= parseInt(end.value)) {
		console.info("遍历完毕");
	} else {
		start.value = parseInt(start.value) + 1;
		setTimeout(getPage, config.interval);
	}
}
