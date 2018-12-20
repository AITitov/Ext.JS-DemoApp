Ext.onReady(function () {

    // grid
    Ext.define('VK.WebParts.DocSetProperties', {
        extend: 'Ext.grid.Panel',
        preventHeader: true,
        itemID: null,
        webUrl: null,
        listTitle: null,
        editFormUrl: null,
        dispFormUrl: null,
        tbar: [],
        columns: [{
            text: 'Название',
            dataIndex: 'Title',
            flex: 1
        }, {
            text: 'Значение',
            dataIndex: 'Value',
            flex: 1,

        }],
        listeners: {
            beforerender: function () {
                loadDocsetProperties(this);
                checkCurrentUserEditPermission(this);
            }
        }
    });
	// dispForm
    Ext.define('VK.WebParts.DispForm', {
        extend: 'Ext.grid.Panel',
        preventHeader: true,
        itemID: null,
        webUrl: null,
        listTitle: null,
        columns: [{
            text: 'Название',
            dataIndex: 'Title',
            flex: 2
        }, {
            text: 'Значение',
            dataIndex: 'Value',
            flex: 3,
            style: {
                "white-space": 'normal'
            }
        }],
        listeners: {
            beforerender: function () {
                loadDocsetProperties(this);
                
            }
        },
        bbar: ['->',
            {
                type: 'button',
                text: 'Закрыть',
                handler: function () {
                    window.frameElement.cancelPopUp();
                }
            }
        ]

    });

    // editForm
    Ext.define('VK.WebParts.EditForm', {
        extend: 'Ext.form.Panel',
        preventHeader: true,
        defaultType: 'textfield',
        defaults: {
            labelWidth: 200,
        },
        itemID: null,
        webUrl: null,
        listTitle: null,
        bbar: [],
        model: null,
        items: [],
        flex: 1,
        listeners: {
            beforerender: function () {
                SetEditFormFields(this);
                //checkCurrentUserEditPermission(this);
            }
        }
    });

    // TreePanel
	Ext.define('VK.Components.TreePanel', {
		extend: 'Ext.tree.Panel',
		alias: 'VKTreePanel',
		rootVisible: false,
		store: {
			type: 'tree',
			parentIdProperty: 'parentId',
			proxy: {
				type: 'memory',
				reader: {
					type: 'json',
				}
			}
		},
		listeners: {
			beforeselect: function (t, record, index, eOpts) {
				if (record.data.parentId == 'root')
					return false;
			}
		},
		filterStore: function (value) {
			store = this.store,
				searchString = value.toLowerCase(),
				filterFn = function (node) {
					var children = node.childNodes,
						len = children && children.length,
						visible = v.test(node.get('text')), i;
					if (!visible) {
						for (i = 0; i < len; i++) {
							if (children[i].isLeaf()) {
								visible = children[i].get('visible');
							} else {
								visible = filterFn(children[i]);
							}
							if (visible) {
								break;
							}
						}
					} else {
						for (i = 0; i < len; i++) {
							children[i].set('visible', true);
						}
					}
					return visible;
				};

			if (searchString.length < 1) {
				store.clearFilter();
			} else {
				v = new RegExp(searchString, 'i');
				store.getFilters().replaceAll({
					filterFn: filterFn
				});
			}
		},
		dockedItems: [{
			xtype: 'toolbar',
			doc: 'top',
			layout: { type: 'hbox', align: 'stretch' },
			items: [{
				xtype: 'textfield',
				id: 'budgetPositionSearchField',
				dock: 'top',
				flex: 1,
				emptyText: 'Поиск',
				enableKeyEvents: true,
				triggers: {
					clear: {
						cls: 'x-form-clear-trigger',
						handler: function () {
							this.setValue();
							this.up().up().store.clearFilter();
							this.getTrigger('clear').hide();
						},
						hidden: true,
						scope: 'this'
					},
					search: {
						cls: 'x-form-search-trigger',
						weight: 1,
						handler: function () {
							this.up().up().filterStore(this.getValue());
						},
						scope: 'this'
					},
				},
				listeners: {
					keyup: {
						fn: function (field, event, eOpts) {
							var value = field.getValue();
							if (value == '') {
								field.getTrigger('clear').hide();
								this.up().up().filterStore(value);
								lastFilterValue = value;
							} else {
								field.getTrigger('clear')[(value.length > 0) ? 'show' : 'hide']();
								this.up().up().filterStore(value);
								lastFilterValue = value;
							}
						},
						buffer: 200
					},
				}
			},' ']
		}],
	});


});

