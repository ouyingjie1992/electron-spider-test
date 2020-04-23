/**
 * preload.js
 * code: 1000=>返回woff地址
 * code: 2000=>返回接口数据
 */
const xhrProxy = require("./xhr_proxy.js");
const { ipcRenderer } = require("electron");

let woffPath = '';
let getWoff = setInterval(()=> {
    if(woffPath !== '') {
        ipcRenderer.sendToHost(JSON.stringify({
            code: 1000,
            data: woffPath
        }));
        clearInterval(getWoff);
    }
    let result = '';
    let styles = document.getElementsByTagName('style');
    for(let i=0; i<styles.length; i++) {
        let innerText = styles[i].innerText;
        let index = innerText.indexOf('.woff');
        if(index !== -1) {
            result = innerText.slice(0, index);
            let lastIndex = result.lastIndexOf('url("//');
            result = result.slice(lastIndex);
            result = result.replace('url("//', 'https://');
            result += '.woff';
            break;
        }
    }
    woffPath = result;
}, 2000);

xhrProxy.addHandler(function (xhr) {
	//TODO 具体业务代码
	//通过ipcRenderer.sendToHost即可将xhr内容发送到BrowserWindow中
	let url = xhr.responseURL;
    let data = '';
    let type = '';
	if(url.indexOf('poi/food') !== -1) {
        type = 'foodlist';
        data = xhr.responseText;
    } else if(url.indexOf('search/poi') !== -1) {
        type = 'searchlist';
        data = xhr.responseText;
    } else if(url.indexOf('channel/kingkongshoplist') !== -1) {
        type = 'shoplist';
        data = xhr.responseText;
    }
    if(type!=='' && data!=='') {
        ipcRenderer.sendToHost(JSON.stringify({
            code: 2000,
            data: {
                data: data,
                type: type
            }
        }));
    }
});

ipcRenderer.on('back', () => {
    history.back();
})
