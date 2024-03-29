const openDirectory = async (mode = "read") => {
    // Feature detection. The API needs to be supported
    // and the app not run in an iframe.
    const supportsFileSystemAccess =
        "showDirectoryPicker" in window &&
        (() => {
            try {
                return window.self === window.top;
            } catch {
                return false;
            }
        })();
    // If the File System Access API is supported…
    if (supportsFileSystemAccess) {
        let directoryStructure = undefined;

        const getFiles = async (dirHandle, path = dirHandle.name) => {
            const dirs = [];
            const files = [];
            for await (const entry of dirHandle.values()) {
                const nestedPath = `${path}/${entry.name}`;
                if (entry.kind === "file") {
                    files.push(
                        entry.getFile().then((file) => {
                            file.directoryHandle = dirHandle;
                            file.handle = entry;
                            return Object.defineProperty(file, "webkitRelativePath", {
                                configurable: true,
                                enumerable: true,
                                get: () => nestedPath,
                            });
                        })
                    );
                } else if (entry.kind === "directory") {
                    dirs.push(getFiles(entry, nestedPath));
                }
            }
            return [
                ...(await Promise.all(dirs)).flat(),
                ...(await Promise.all(files)),
            ];
        };

        try {
            const handle = await showDirectoryPicker({
                mode,
            });
            directoryStructure = getFiles(handle, undefined);
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error(err.name, err.message);
            }
        }
        return directoryStructure;
    }
    // Fallback if the File System Access API is not supported.
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;

        input.addEventListener('change', () => {
            let files = Array.from(input.files);
            resolve(files);
        });
        if ('showPicker' in HTMLInputElement.prototype) {
            input.showPicker();
        } else {
            input.click();
        }
    });
};

jQuery(window).ready(() => {
    console.log('Script Loaded!')
    const button = jQuery('#folder-btn')
    const gallery = jQuery('#animated-thumbnails-gallery')

    gallery.justifiedGallery({
        captions: false,
        lastRow: "hide",
        rowHeight: 180,
        margins: 5
    }).on("jg.complete", function () {
        window.lightGallery(gallery, {
            // dynamic: true,
            hash: false,
            rotate: true,
            plugins: [
                lgZoom,
                lgThumbnail
            ],
            // dynamicEl: [],
            animateThumb: true,
            zoomFromOrigin: false,
            allowMediaOverlap: true,
            toggleThumb: true,
        })
    })

    button.click(async () => {
        const filesInDirectory = await openDirectory();
        if (!filesInDirectory) {
            return;
        }

        // let newElements = []
        gallery.html('')
        for (let file of filesInDirectory) {
            if (!file.type.startsWith('image')) continue
            let buffer = await file.arrayBuffer()
            let blob = new Blob([buffer], { type: file.type })
            let url = URL.createObjectURL(blob)

            let img = new Image
            let img2 = new Image
            img.className = 'img-responsive'

            let a = document.createElement('a')
            a.className = 'gallery-item'
            a.setAttribute('data-src', url)
            a.setAttribute('data-sub-html', file.name)

            img2.onload = function () {
                a.setAttribute('data-lg-size', `${img2.width}-${img2.height}`)
            }
            img.src = url
            img2.src = url
            a.appendChild(img)
            gallery.append(a)

            // newElements.push({
            //     src: url,
            //     thumb: url,
            //     subHtml: file.name
            // })
        }
        // gallery.justifiedGallery('destroy')
        gallery.justifiedGallery({
            captions: false,
            lastRow: "hide",
            rowHeight: 180,
            margins: 5
        }).on("jg.complete", function () {
            window.lightGallery(document.getElementById('#animated-thumbnails-gallery'), {
                // dynamic: true,
                rotate: true,
                // dynamicEl: [],
                animateThumb: true,
                zoomFromOrigin: false,
                allowMediaOverlap: true,
                toggleThumb: true,
                pager: false,
                plugins: [lgZoom, lgThumbnail],
                mobileSettings: {
                    controls: false,
                    showCloseIcon: false,
                    download: false,
                    rotate: false
                }
            })
        })
        // dynamicimgGallery.refresh(newElements)
        // dynamicimgGallery.openGallery()
    })
})