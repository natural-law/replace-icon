'use strict';

const Fs = require('fire-fs');
const Path = require('path');
const Electron = require('electron');

const MacIconPath = 'frameworks/runtime-src/proj.ios_mac/mac/Icon.icns';
const WindowsIconPath = 'frameworks/runtime-src/proj.win32/res/game.ico';
const IOSIconsDir = 'frameworks/runtime-src/proj.ios_mac/ios';
const IOSIconNamePattern = 'Icon-([0-9]+).png';
const AndroidProjectInfo = [
    {
        resDir: 'frameworks/runtime-src/proj.android/res',
        iconFolderPattern: 'drawable.*',
        iconName: 'icon.png'
    },
    {
        resDir: 'frameworks/runtime-src/proj.android-studio/app/res',
        iconFolderPattern: 'mipmap.*',
        iconName: 'ic_launcher.png'
    }
];

Editor.Panel.extend({
    style: `
    @import url('app://bower_components/fontawesome/css/font-awesome.min.css');

    :host {
        margin: 10px 10px;
        display: flex;
        flex-direction: column;
        padding: 0 10px;
    }

    section {
        flex: 1;
        overflow-y: auto;
    }

    footer {
        padding: 10px 0;
        justify-content: flex-end;
    }
    `,

    template: `
    <section>
        <ui-prop name="Project Name">
            <ui-select class="flex-1" v-value="projPath">
                <template v-for="item in projNames">
                    <option v-bind:value="item.value">{{item.text}}</option>
                </template>
            </ui-select>
        </ui-prop>

        <ui-prop name="Platforms" auto-height>
            <div class="flex-1 layout horizontal">
                <ui-checkbox class="item" v-value="ios">
                    iOS
                </ui-checkbox>
                <ui-checkbox class="item" v-value="android">
                    Android
                </ui-checkbox>
                <ui-checkbox class="item" v-value="mac">
                    Mac
                </ui-checkbox>
                <ui-checkbox class="item" v-value="windows">
                    Windows
                </ui-checkbox>
            </div>
        </ui-prop>

        <ui-prop name=".png File Path"
                 v-disabled="!ios && !android"
                 tooltip="Select a png file as the new icon.">
            <div class="layout horizontal content flex-1">
                <ui-input class="flex-2"
                          v-value="pngPath">
                </ui-input>
                <ui-button class="small" id="choosePNG"
                           v-on:confirm="onChooseFile">
                        ···
                </ui-button>
                <ui-button class="small" id="showPNG"
                           v-on:confirm="onShowFile">
                        ${Editor.T('SHARED.open')}
                </ui-button>
            </div>
        </ui-prop>

        <ui-prop name=".icns File Path"
                 v-disabled="!mac"
                 tooltip="Select a icns file as the Mac App icon.">
            <div class="layout horizontal content flex-1">
                <ui-input class="flex-2"
                          v-value="icnsPath">
                </ui-input>
                <ui-button class="small" id="chooseICNS"
                           v-on:confirm="onChooseFile">
                        ···
                </ui-button>
                <ui-button class="small" id="showICNS"
                           v-on:confirm="onShowFile">
                        ${Editor.T('SHARED.open')}
                </ui-button>
            </div>
        </ui-prop>

        <ui-prop name=".ico File Path"
                 v-disabled="!windows"
                 tooltip="Select a ico file as the Windows App icon.">
            <div class="layout horizontal content flex-1">
                <ui-input class="flex-2"
                          v-value="icoPath">
                </ui-input>
                <ui-button class="small" id="chooseICO"
                           v-on:confirm="onChooseFile">
                        ···
                </ui-button>
                <ui-button class="small" id="showICO"
                           v-on:confirm="onShowFile">
                        ${Editor.T('SHARED.open')}
                </ui-button>
            </div>
        </ui-prop>
    </section>

    <footer class="layout horizontal">
        <ui-button
            class="green"
            v-disabled="(!ios && !android && !mac && !windows) || !projPath"
            v-on:confirm="_onReplaceClick"
        >
            Replace
        </ui-button>
    </footer>
    `,

    ready () {
        var vm = this._vm = new window.Vue({
            el: this.shadowRoot,
            data: {
                projPath: '',
                projNames: [],
                ios: false,
                android: false,
                mac: false,
                windows: false,
                pngPath: '',
                icnsPath: '',
                icoPath: ''
            },
            methods: {
                onChooseFile: function(event) {
                    event.stopPropagation();
                    var target = event.target;
                    var ext = '';
                    var defaultPath = '';
                    switch (target.id) {
                        case 'choosePNG':
                            ext = 'png';
                            defaultPath = this.pngPath;
                            break;
                        case 'chooseICNS':
                            ext = 'icns';
                            defaultPath = this.icnsPath;
                            break;
                        case 'chooseICO':
                            ext = 'ico';
                            defaultPath = this.icoPath;
                            break;
                        default:
                            break;
                    }

                    if (!ext) {
                        return;
                    }

                    let res = Editor.Dialog.openFile({
                        defaultPath: defaultPath,
                        filters: [
                            {
                                name: `.${ext} File`,
                                extensions: [ ext ]
                            }
                        ],
                        properties: ['openFile']
                    });
                    if (res && res[0]) {
                        switch (target.id) {
                            case 'choosePNG':
                                this.pngPath = res[0];
                                break;
                            case 'chooseICNS':
                                this.icnsPath = res[0];
                                break;
                            case 'chooseICO':
                                this.icoPath = res[0];
                                break;
                            default:
                                break;
                        }
                    }
                },

                onShowFile: function(event) {
                    event.stopPropagation();
                    var target = event.target;
                    var thePath = '';
                    switch (target.id) {
                        case 'showPNG':
                            thePath = this.pngPath;
                            break;
                        case 'showICNS':
                            thePath = this.icnsPath;
                            break;
                        case 'showICO':
                            thePath = this.icoPath;
                            break;
                        default:
                            break;
                    }

                    if (!thePath) {
                        return;
                    }

                    if (!Fs.existsSync(thePath)) {
                        Editor.warn('%s not exists!', thePath);
                        return;
                    }
                    Electron.shell.showItemInFolder(thePath);
                    Electron.shell.beep();
                },

                _onReplaceClick : function(event) {
                    event.stopPropagation();
                    this.ios && this._replaceIOS();
                    this.android && this._replaceAndroid();
                    this.mac && this._replaceMac();
                    this.windows && this._replaceWindows();
                },

                _replaceIOS: function() {
                    Editor.log('replace ios icon');
                },

                _replaceAndroid: function() {
                    Editor.log('replace android icon');
                },

                _replaceMac: function() {
                    var ret = this._replaceByCopy('.icns', this.icnsPath, MacIconPath);
                    if (!ret) {
                        Editor.warn('Replace Mac icon failed');
                    } else {
                        Editor.log('Replace Mac icon succeed!');
                    }
                },

                _replaceWindows: function() {
                    var ret = this._replaceByCopy('.ico', this.icoPath, WindowsIconPath);
                    if (!ret) {
                        Editor.warn('Replace Windows icon failed');
                    } else {
                        Editor.log('Replace Windows icon succeed!');
                    }
                },

                _replaceByCopy: function(ext, srcPath, dstPath) {
                    if (!srcPath) {
                        Editor.warn(`Please specify a ${ext} file.`);
                        return false;
                    }

                    if (!Fs.existsSync(srcPath)) {
                        Editor.warn(`${srcPath} is not existed.`);
                        return false;
                    }

                    if (Path.extname(srcPath) !== ext) {
                        Editor.warn(`${srcPath} is not a ${ext} file.`);
                        return false;
                    }

                    var targetFile = Path.normalize(Path.join(this.projPath, dstPath));
                    try {
                        Fs.copySync(srcPath, targetFile);
                    } catch (err) {
                        Editor.warn(`Copy file ${srcPath} to ${targetFile} failed. message: ${err.stack}`);
                        return false;
                    }

                    return true;
                },

                _resizePngToPath: function(srcPng, dstPng, resize) {

                }
            }
        });

        this._createProjNames();
    },

    _createProjNames : function() {
        Editor.Profile.load('profile://local/builder.json', (err, profile) => {
            if (err) {
                Editor.error(`Get the build path failed. Please Build the project first.`);
                return;
            }

            var buildPath = profile.data.buildPath;
            var ret = [];
            if (!Fs.existsSync(buildPath) || !Fs.isDirSync(buildPath)) {
                Editor.error(`Build Path ${buildPath} is invalid. Please Build the project first.`);
                return ret;
            }

            Fs.readdirSync(buildPath).forEach(function(file){
                var curPath = Path.join(buildPath, file);
                if (Fs.isDirSync(curPath) && file.indexOf('jsb-') === 0) {
                    ret.push({
                        value: curPath,
                        text: file
                    })
                }
            });

            if (ret.length === 0) {
                Editor.error('There is not any native project path. Please Build the project first.');
            }

            this._vm.projNames = ret;
        });
    }
});
