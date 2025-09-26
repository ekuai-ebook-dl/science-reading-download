# https://github.com/KmBase/ScienceReading/issues/4#issuecomment-2668969664
function downloadBlob(blob, fileName) {
    const downloadElement = document.createElement('a')
    const href = window.URL.createObjectURL(blob) // 创建下载的链接
    downloadElement.href = href
    downloadElement.download = fileName // 下载后文件名
    document.body.appendChild(downloadElement)
    downloadElement.click() // 点击下载
    document.body.removeChild(downloadElement) // 下载完成移除元素
    window.URL.revokeObjectURL(href) // 释放掉blob对象
}

function mergeArrayBuffers(arrayBuffers) {
    // 计算新的ArrayBuffer的总长度
    let totalLength = 0;
    for (const buffer of arrayBuffers) {
        totalLength += buffer.byteLength;
    }
    // 创建一个新的ArrayBuffer
    const mergedBuffer = new ArrayBuffer(totalLength);
    // 创建一个Uint8Array以便操作新的ArrayBuffer
    const uint8Array = new Uint8Array(mergedBuffer);
    let offset = 0;
    // 逐个复制ArrayBuffer到新的ArrayBuffer中
    for (const buffer of arrayBuffers) {
        const sourceArray = new Uint8Array(buffer);
        uint8Array.set(sourceArray, offset);
        offset += sourceArray.length;
    }
    return mergedBuffer;
}

async function dumpBookmarks(api) {
    async function dump(data) {
        children = await Promise.all((await api.getBookmarkChildren(data.id)).map(dump))
        return { data, children }
    }
    return await Promise.all((await api.getBookmarkChildren()).map(dump))
}

async function loadBookmarks(api, tree) {
    async function load(node, parent) {
        node.data.id = await api.addBookmark({
            color: node.data.color,
            destination: {
                pageIndex: node.data.page,
                left: node.data.left,
                top: node.data.top,
                zoomFactor: node.data.zoomFactor,
                zoomMode: node.data.zoomMode,
            },
            style: {
                bold: node.data.isBold,
                italic: node.data.isItalic,
            },
            title: node.data.title,
            destId: parent ? parent.data.id : undefined,
            relationship: 1 /* LAST_CHILD */,
        })
        await Promise.all(node.children.map(child => load(child, node)))
    }
    await Promise.all(tree.map(node => load(node, null)))
}

bookmarkApi = await pdfui.getBookmarkDataService()
doc = await pdfui.getCurrentPDFDoc()
fileName = doc.getFileName()
count = doc.getPageCount()
pages = mergeArrayBuffers(await doc.extractPages([[0, count - 1]]))
bookmarks = await dumpBookmarks(bookmarkApi)
newDoc = await pdfui.createNewDoc(fileName)
await newDoc.insertPages({
	file: pages,
	startIndex: 0,
	endIndex: count - 1,
})
// 新文档会自带一个空白页，插入后它在最后一页，将其删去
await newDoc.removePage(newDoc.getPageCount() - 1)
await loadBookmarks(bookmarkApi, bookmarks)
file = await newDoc.getFile()
downloadBlob(file, fileName)
