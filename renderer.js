(() => {
    const {dialog} = window.nodeRequire("electron").remote;
    const fs = window.nodeRequire("fs");
    const path = window.nodeRequire("path");
    const request = window.nodeRequire('request');
    const webview = document.getElementById("chrome-content-01");
    // preload
    const preloadFile = "file://" + window.nodeRequire("path").resolve("preload.js");
    let resData = { //接口数据
        foodlist: [],
        searchlist: [],
        shoplist: [],
    }; //已下载数据
    let woffPath = '';
    // 是否已经下载woff
    let hasWoff = false;
    
    webview.setAttribute("preload", preloadFile);
    webview.addEventListener("ipc-message", (event) => {
        //ipc-message监听，被webview加载页面传来的信息
        // console.log(event.channel); //最终收到消息输出   子页面信息
        let res = JSON.parse(event.channel);
        if (res.code === 2000) {
            // resData.push(res.data);
            downloadData(res.data);
        } else if (res.code === 1000) {
            // resData.push(res.data);
            woffPath = res.data || '';
        }
    });
    // webview.addEventListener("dom-ready", function(){
    //     webview.openDevTools() // 这里！ 打开 webview的控制台
    // });
    const loadstart = () => {
        document.getElementById('loading').style.display = 'inline-block';
    }

    const loadstop = () => {
        document.getElementById('loading').style.display = 'none';
    }

    webview.addEventListener('did-start-loading', loadstart)
    webview.addEventListener('did-stop-loading', loadstop)

    // 设置存储路径
    let filePath = ""; //接口数据
    const setPath = async () => {
        dialog.showOpenDialog({properties: ["openDirectory"]}).then(async (files) => {
            if (files.filePaths.length > 0) {
                // 如果有选中
                filePath = files.filePaths[0];
                await dirExists(filePath);
                if(!hasWoff) {
                    hasWoff = await saveWoff();
                    if(!hasWoff) {
                        alert('woff文件存储失败，请手动下载，或者重启程序');
                    }
                }
                webview.style.display = 'inline-flex';
                document.getElementById('outPath').innerHTML = filePath;
            } else {
                filePath = '';
                alert('请选择有效的存储路径');
            }
        });
    };

    // 存储woff文件
    const saveWoff = async () => {
        return new Promise((resolve, reject) => {
            if(woffPath==null || woffPath==='') {
                resolve(false);
            }
            const mypath = path.resolve(filePath, 'test.woff');
            const writer = fs.createWriteStream(mypath);
            let sd = request(woffPath);
            sd.pipe(writer); 
            writer.on("finish", ()=>{
                resolve(true);
            });
            writer.on("error", reject);
        });
    };
    const downWoff = () => {
        if(woffPath== null || woffPath==='') {
            alert('woff文件存储失败，请重试，或者重启程序');
        }
        window.open(woffPath);
    };

    // 更新已下载数据信息
    const updateData = (data) => {
        if (data.type === 'foodlist') {
            resData.foodlist.push(data.data);
        } else if (data.type === 'searchlist') {
            resData.searchlist.push(data.data);
        } else if (data.type === 'shoplist') {
            resData.shoplist.push(data.data);
        }

        document.getElementById("shoplistLength").innerHTML = resData.shoplist.length;
        document.getElementById("foodlistLength").innerHTML = resData.foodlist.length;
        document.getElementById("searchlistLength").innerHTML = resData.searchlist.length;
    };

    const backPage = () => {
        webview.send('back');
    };


    /**
     * 读取路径信息
     * @param {string} outPath 路径
     */
    const getStat = (outPath) => {
        return new Promise((resolve, reject) => {
            fs.stat(outPath, (err, stats) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(stats);
                }
            });
        });
    };

    /**
     * 创建路径
     * @param {string} dir 路径
     */
    const mkdir = (dir) => {
        return new Promise((resolve, reject) => {
            fs.mkdir(dir, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    };

    /**
     * 路径是否存在，不存在则创建
     * @param {string} dir 路径
     */
    const dirExists = async (dir) => {
        let isExists = await getStat(dir);
        //如果该路径存在且不是文件，返回true
        if (isExists && isExists.isDirectory()) {
            return true;
        } else if (isExists) {
            //如果该路径存在但是文件，返回false
            return false;
        }
        //如果该路径不存在
        let tempDir = path.parse(dir).dir; //拿到上级路径
        //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
        let status = await dirExists(tempDir);
        let mkdirStatus;
        if (status) {
            mkdirStatus = await mkdir(dir);
        }
        return mkdirStatus;
    };
    //下载数据
    const downloadData = async (data) => {
        if(filePath==null || filePath === '') {
            return false;
        }
        let outPath = filePath;
        if (data.type === "foodlist") {
            outPath += "/foodlist";
        } else if (data.type === "searchlist") {
            outPath += "/searchlist";
        } else if (data.type === "shoplist") {
            outPath += "/shoplist";
        }
        await dirExists(outPath);

        let nowDate = new Date();
        nowDate = nowDate.getTime();
        // 写入json文件
        outPath = `${outPath}/${nowDate}.json`;
        let outPathReal = path.resolve(outPath);
        fs.writeFile(outPathReal, data.data, {}, (err, resData) => {
            if (err) {
                throw err;
            } else {
                updateData(data);
            }
        });
    };



    
    // 下载数据
    document.getElementById("back-btn").addEventListener("click", backPage);
    // 设置存储路径
    document.getElementById("set-path-btn").addEventListener("click", setPath);
    // 下载woff
    document.getElementById("woff-btn").addEventListener("click", downWoff);
})();
