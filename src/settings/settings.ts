import {
    App,
    Modal,
    Notice,
    PluginSettingTab,
    Setting,
    TextComponent
} from "obsidian";
import { Layout, Layout5e } from "src/data/constants";
import {
    ImportEntitiesFromXml,
    ImportEntitiesFromImprovedInitiative,
    ImportFrom5eTools,
    ImportFromCritterDB
} from "src/importers";
import type StatBlockPlugin from "src/main";
import StatblockCreator from "./StatblockCreator.svelte";
import { MonsterSuggester } from "src/util/suggester";

export default class StatblockSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: StatBlockPlugin) {
        super(app, plugin);
    }

    async display(): Promise<void> {
        try {
            let { containerEl } = this;

            containerEl.empty();

            containerEl.addClass("statblock-settings");

            containerEl.createEl("h2", { text: "TTRPG Statblock Settings" });

            const statblockCreatorContainer = containerEl.createDiv(
                "statblock-additional-container"
            );
            new Setting(statblockCreatorContainer)
                .setName("Layouts")
                .setDesc(
                    createFragment((el) => {
                        el.createSpan({
                            text: "New statblock layouts can be created and managed here. A specific statblock can be used for a creature using the "
                        });
                        el.createEl("code", { text: "statblock" });
                        el.createSpan({ text: " parameter." });
                    })
                )
                .addButton((b) =>
                    b
                        .setIcon("plus-with-circle")
                        .setTooltip("Add New Statblock")
                        .onClick(() => {
                            const modal = new CreateStatblockModal(this.plugin);
                            modal.open();
                        })
                );
            const statblockAdditional =
                statblockCreatorContainer.createDiv("additional");
            new Setting(statblockAdditional)
                .setName("Default Layout")
                .setDesc(
                    "Change the default statblock layout used, if not specified."
                )
                .addDropdown(async (d) => {
                    d.addOption(Layout5e.name, Layout5e.name);
                    for (const layout of this.plugin.settings.layouts) {
                        d.addOption(layout.name, layout.name);
                    }

                    if (
                        !this.plugin.settings.default ||
                        !this.plugin.settings.layouts.find(
                            ({ name }) => name == this.plugin.settings.default
                        )
                    ) {
                        this.plugin.settings.default = Layout5e.name;
                        await this.plugin.saveSettings();
                    }

                    d.setValue(this.plugin.settings.default ?? Layout5e.name);

                    d.onChange(async (v) => {
                        this.plugin.settings.default = v;
                        await this.plugin.saveSettings();
                    });
                });

            const layoutContainer =
                statblockCreatorContainer.createDiv("additional");

            this.buildCustomLayouts(layoutContainer);

            const importSettingsContainer = containerEl.createDiv(
                "statblock-additional-container"
            );

            new Setting(importSettingsContainer)
                .setName("Import Monsters")
                .setDesc(
                    "Import monsters from monster files. Monsters are stored by name, so only the last monster by that name will be saved. This is destructive - any saved monster will be overwritten."
                );

            const importAdditional =
                importSettingsContainer.createDiv("additional");
            const importAppFile = new Setting(importAdditional)
                .setName("Import DnDAppFile")
                .setDesc("Only import content that you own.");
            const inputAppFile = createEl("input", {
                attr: {
                    type: "file",
                    name: "dndappfile",
                    accept: ".xml"
                }
            });

            inputAppFile.onchange = async () => {
                const { files } = inputAppFile;
                if (!files.length) return;
                try {
                    const importedMonsters = await ImportEntitiesFromXml(
                        ...Array.from(files)
                    );
                    try {
                        await this.plugin.saveMonsters(
                            Array.from(importedMonsters.values())
                        );
                        new Notice(
                            `Successfully imported ${importedMonsters.size} monsters.`
                        );
                    } catch (e) {
                        new Notice(
                            `There was an issue importing the file${
                                files.length > 1 ? "s" : ""
                            }.`
                        );
                    }
                    this.display();
                } catch (e) {}
            };

            importAppFile.addButton((b) => {
                b.setButtonText("Choose File").setTooltip(
                    "Import DnDAppFile Data"
                );
                b.buttonEl.addClass("statblock-file-upload");
                b.buttonEl.appendChild(inputAppFile);
                b.onClick(() => inputAppFile.click());
            });

            const importImprovedInitiative = new Setting(importAdditional)
                .setName("Import Improved Initiative Data")
                .setDesc("Only import content that you own.");
            const inputImprovedInitiative = createEl("input", {
                attr: {
                    type: "file",
                    name: "improvedinitiative",
                    accept: ".json"
                }
            });

            inputImprovedInitiative.onchange = async () => {
                const { files } = inputImprovedInitiative;
                if (!files.length) return;
                try {
                    const importedMonsters =
                        await ImportEntitiesFromImprovedInitiative(
                            ...Array.from(files)
                        );

                    try {
                        await this.plugin.saveMonsters(
                            Array.from(importedMonsters.values())
                        );
                        new Notice(
                            `Successfully imported ${importedMonsters.size} monsters.`
                        );
                    } catch (e) {
                        new Notice(
                            `There was an issue importing the file${
                                files.length > 1 ? "s" : ""
                            }.`
                        );
                    }
                    this.display();
                } catch (e) {}
            };

            importImprovedInitiative.addButton((b) => {
                b.setButtonText("Choose File").setTooltip(
                    "Import Improved Initiative Data"
                );
                b.buttonEl.addClass("statblock-file-upload");
                b.buttonEl.appendChild(inputImprovedInitiative);
                b.onClick(() => inputImprovedInitiative.click());
            });

            const importCritterDB = new Setting(importAdditional)
                .setName("Import CritterDB Data")
                .setDesc("Only import content that you own.");
            const inputCritterDB = createEl("input", {
                attr: {
                    type: "file",
                    name: "critterdb",
                    accept: ".json"
                }
            });

            inputCritterDB.onchange = async () => {
                const { files } = inputCritterDB;
                if (!files.length) return;
                try {
                    const importedMonsters = await ImportFromCritterDB(
                        ...Array.from(files)
                    );

                    try {
                        await this.plugin.saveMonsters(
                            Array.from(importedMonsters.values())
                        );
                        new Notice(
                            `Successfully imported ${importedMonsters.size} monsters.`
                        );
                    } catch (e) {
                        new Notice(
                            `There was an issue importing the file${
                                files.length > 1 ? "s" : ""
                            }.`
                        );
                    }
                    this.display();
                } catch (e) {}
            };

            importCritterDB.addButton((b) => {
                b.setButtonText("Choose File").setTooltip(
                    "Import CritterDB Data"
                );
                b.buttonEl.addClass("statblock-file-upload");
                b.buttonEl.appendChild(inputCritterDB);
                b.onClick(() => inputCritterDB.click());
            });

            const import5eTools = new Setting(importAdditional)
                .setName("Import 5e.tools Data")
                .setDesc("Only import content that you own.");
            const input5eTools = createEl("input", {
                attr: {
                    type: "file",
                    name: "fivetools",
                    accept: ".json"
                }
            });

            input5eTools.onchange = async () => {
                const { files } = input5eTools;
                if (!files.length) return;
                try {
                    const importedMonsters = await ImportFrom5eTools(
                        ...Array.from(files)
                    );

                    try {
                        await this.plugin.saveMonsters(
                            Array.from(importedMonsters.values())
                        );
                        new Notice(
                            `Successfully imported ${importedMonsters.size} monsters.`
                        );
                    } catch (e) {
                        new Notice(
                            `There was an issue importing the file${
                                files.length > 1 ? "s" : ""
                            }.`
                        );
                    }
                    this.display();
                } catch (e) {}
            };

            import5eTools.addButton((b) => {
                b.setButtonText("Choose File").setTooltip(
                    "Import 5e.tools Data"
                );
                b.buttonEl.addClass("statblock-file-upload");
                b.buttonEl.appendChild(input5eTools);
                b.onClick(() => input5eTools.click());
            });

            const additionalContainer = containerEl.createDiv(
                "statblock-additional-container statblock-monsters"
            );
            let monsterFilter: TextComponent;
            const filters = additionalContainer.createDiv(
                "statblock-monster-filter"
            );
            const searchMonsters = new Setting(filters)
                .setName("Homebrew Monsters")
                .addSearch((t) => {
                    t.setPlaceholder("Filter Monsters");
                    monsterFilter = t;
                });

            const additional = additionalContainer.createDiv("additional");
            if (!this.plugin.data.size) {
                additional
                    .createDiv({
                        attr: {
                            style: "display: flex; justify-content: center; padding-bottom: 18px;"
                        }
                    })
                    .createSpan({
                        text: "No saved monsters! Create one to see it here."
                    });
                return;
            }

            let suggester = new MonsterSuggester(
                this.plugin,
                monsterFilter,
                additional,
                new Set(this.plugin.sources)
            );

            const sourcesSetting = filters.createEl("details");
            sourcesSetting.createEl("summary", { text: "Filter Sources" });
            const list = sourcesSetting.createEl(
                "ul",
                "contains-task-list task-list-inline markdown-preview-view"
            );

            for (let source of this.plugin.sources) {
                const li = list.createEl("li", "task-list-item");
                li.createEl("input", {
                    attr: {
                        id: "input_" + source,
                        checked: true
                    },
                    type: "checkbox",
                    cls: "task-list-item-checkbox"
                }).onclick = (evt) => {
                    const target = evt.target as HTMLInputElement;
                    if (target.checked) {
                        suggester.displayed.add(source);
                    } else {
                        suggester.displayed.delete(source);
                    }
                    suggester._onInputChanged();
                };
                li.createEl("label", {
                    attr: {
                        for: "input_" + source
                    },
                    text: source
                });
            }

            searchMonsters.setDesc(
                `Manage homebrew monsters. Currently: ${
                    suggester.getItems().length
                } monsters.`
            );

            suggester.onRemoveItem = async (monster) => {
                try {
                    await this.plugin.deleteMonster(monster.name);
                } catch (e) {
                    new Notice(
                        `There was an error deleting the monster:${
                            `\n\n` + e.message
                        }`
                    );
                }
                suggester._onInputChanged();
            };
            suggester.onInputChanged = () =>
                searchMonsters.setDesc(
                    `Manage homebrew monsters. Currently: ${suggester.filteredItems.length} monsters.`
                );

            const div = containerEl.createDiv("coffee");
            div.createEl("a", {
                href: "https://www.buymeacoffee.com/valentine195"
            }).createEl("img", {
                attr: {
                    src: "https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=valentine195&button_colour=e3e7ef&font_colour=262626&font_family=Inter&outline_colour=262626&coffee_colour=ff0000"
                }
            });
        } catch (e) {
            new Notice(
                "There was an error displaying the settings tab for 5e Statblocks."
            );
        }
    }
    buildCustomLayouts(layoutContainer: HTMLDivElement) {
        layoutContainer.empty();
        new Setting(layoutContainer)
            .setName(Layout5e.name)
            .addExtraButton((b) => {
                b.setIcon("duplicate-glyph")
                    .setTooltip("Create Copy")
                    .onClick(async () => {
                        this.plugin.settings.layouts.push({
                            ...Layout5e,
                            name: `${Layout5e.name} Copy`
                        });
                        await this.plugin.saveSettings();
                        this.buildCustomLayouts(layoutContainer);
                    });
            });
        for (const layout of this.plugin.settings.layouts) {
            new Setting(layoutContainer)
                .setName(layout.name)
                .addExtraButton((b) => {
                    b.setIcon("duplicate-glyph")
                        .setTooltip("Create Copy")
                        .onClick(async () => {
                            this.plugin.settings.layouts.push({
                                ...Layout5e,
                                name: `${layout.name} Copy`
                            });
                            await this.plugin.saveSettings();
                            this.buildCustomLayouts(layoutContainer);
                        });
                })
                .addExtraButton((b) => {
                    b.setIcon("pencil")
                        .setTooltip("Edit")
                        .onClick(() => {
                            const modal = new CreateStatblockModal(
                                this.plugin,
                                layout
                            );
                            modal.open();
                        });
                })
                .addExtraButton((b) => {
                    b.setIcon("trash")
                        .setTooltip("Delete")
                        .onClick(async () => {
                            this.plugin.settings.layouts =
                                this.plugin.settings.layouts.filter(
                                    (l) => l.name !== layout.name
                                );
                            await this.plugin.saveSettings();

                            this.buildCustomLayouts(layoutContainer);
                        });
                });
        }
    }
}

class CreateStatblockModal extends Modal {
    creator: StatblockCreator;
    constructor(
        public plugin: StatBlockPlugin,
        public layout: Layout = {
            name: "Layout",
            blocks: []
        }
    ) {
        super(plugin.app);
    }

    onOpen() {
        this.display();
    }

    display() {
        this.creator = new StatblockCreator({
            target: this.contentEl,
            props: {
                layout: this.layout
            }
        });
    }
}
