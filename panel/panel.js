'use strict';

const Fs = require('fire-fs');
const Path = require('path');
const Electron = require('electron');

function createProjNames () {
    // TODO get the valid project names from Profile
    return [
        { value: 'jsb-default', text: 'jsb-default'},
        { value: 'jsb-link', text: 'jsb-link'},
        { value: 'jsb-binary', text: 'jsb-binary'}
    ];
}

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
        new window.Vue({
            el: this.shadowRoot,
            data: {
                projPath: '',
                projNames: createProjNames(),
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
                    Editor.log('replace clicked : ' + JSON.stringify(event));
                }
            }
        });
    }
});
