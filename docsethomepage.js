// Параметры
var apiUrl = ""; // адрес сайта api-сервисов
var paymentRequestWebUrl = ""; // адрес текущего сайта
var contractsWebUrl = ""; // адрес сайта договоров
var notesWebUrl = ""; // адрес сайта служебных записок
var listTitle = encodeURI("Заявки на оплату"); // Название списка заявок, отформатированное для запросов в IE
var contractListTitle = encodeURI("Договоры"); // Название списка договоров, отформатированное для запросов в IE
var listName = "PaymentRequests"; // 
var displayFormUrl = ""; // адрес кастомной формы просмотра элемента
var currItemID = GetUrlKeyValue("ID", false, location.href); // текущий ID


var mutualSettlementsReportUrl = ""; // ссылка на отчет по взаиморасчетам
var budgetPositionReportUrl = ""; // ссылка на отчет по бюджетными позициям


Ext.onReady(function () {

        // Получение доксета и проверка прав на него у текущего пользователя
        var web = new $pnp.Web(paymentRequestWebUrl);
        /*$pnp.setup({
            globalCacheDisable: true
        });*/
        web.lists.getByTitle(listTitle).items.getById(currItemID).get().then(function (item) {
            web.lists.getByTitle(listTitle).items.getById(currItemID).currentUserHasPermissions(3).then(function (hasEditPermission) {
                if(item.ParentDocID != null){
                    var contractWeb = new $pnp.Web(contractsWebUrl);
                    contractWeb.lists.getByTitle(contractListTitle).items.getById(item.ParentDocID).get().then(function (parentDoc) {
                        // Настройка веб-частей
                        Render_Docsethomepage_PaymentRequest(item, hasEditPermission);
                    });
                }
                else
                    Render_Docsethomepage_PaymentRequest(item, hasEditPermission,null);
            });
        });

});

function Render_Docsethomepage_PaymentRequest(item, hasEditPermission,parentDocCost) {

    var toolbar = Ext.create('Ext.toolbar.Toolbar', {
        id: 'PaymentRequestToolbar',
        renderTo: Ext.getElementById('VKButtons')
    });
    authorId = item.AuthorId;
    itemId = item.Id;

    $pnp.sp.web.currentUser.get().then(function (user) {
        $pnp.sp.web.siteGroups.getByName(encodeURI("Администраторы заявок на оплату")).users.get().then(function (users) {

            var urlParams = "";
            switch (item.Type) {
                case "Без основания":
                    urlParams += "Counteragent=" + item.Counteragent;
                    break;
                case "Договор": case "ДС":
                    urlParams += "DefaultContract=" + item.ParentDocID + "&Counteragent=" + item.Counteragent;
                    break;
                case "Закрывающий документ":
                    urlParams += "CaseIsClosedDoc=" + item.ParentDocID + ";" + item.Counteragent;
                    break;
            }
            if ((item.Counteragent_x003a__x0020__x0418__x041d__x041d_ != "") && (item.Counteragent_x003a__x0020__x0418__x041d__x041d_ != null))
                urlParams += ";" + item.Counteragent_x003a__x0020__x0418__x041d__x041d_;


            toolbar.add({
                id: 'budgetPositionReportButton',
                text: 'Отчет по бюджетными позициям',
                handler: function () {
                    //window.open(budgetPositionReportUrl + "Type=2&ID=" + item.ID);
                    window.open(budgetPositionReportUrl + encodeURI(urlParams).replace("+","%2B"));
                }
            });


            toolbar.add({
                id: 'mutualSettlementsReportButton',
                text: 'Отчет по взаиморасчетам',
                handler: function () {

                    window.open(mutualSettlementsReportUrl + encodeURI(urlParams).replace("+","%2B"));
                }
            });
            /*
            if ((typeof (finDepartmentFlag) == "undefined") && (user.Title.indexOf("spfarm") == -1)) {
                Ext.getCmp("budgetPositionReportButton").hide();
                Ext.getCmp("mutualSettlementsReportButton").hide();
            }*/
        });
    });

    // Вывод реквизитов заявки 
    var grid = new VK.WebParts.DocSetProperties({
        renderTo: Ext.getElementById("paymentRequestPropertiesContainer"),
        webUrl: paymentRequestWebUrl,
        listTitle: listTitle,
        itemID: item.ID,
        editFormUrl: paymentRequestWebUrl + '/PaymentRequests/Forms/EditForm.aspx?ID=' + item.ID,
        //dispFormUrl: paymentRequestWebUrl + '/PaymentRequests/Forms/DispForm.aspx?ID=' + item.ID, // стандартный dispform
        dispFormUrl: displayFormUrl + '?ID=' + item.ID, // кастомный dispform
        fields: GetDocsetFieldArray(item),
        columns: [{
            text: 'Название',
            dataIndex: 'Title',
            flex: 1

        }, {
            text: 'Значение',
            dataIndex: 'Value',
            flex: 1,
            renderer: function (value, metaData, record, rowIndex, colIndex, store) {
                if ((record.data.Title == "Договор") || (record.data.Title == "ДС") || (record.data.Title == "Закрывающий документ"))
                    return "<a class='parentDocLink' href='" + contractsWebUrl + "/Contracts/" + value.replace("/", "_") + "'>" + value + "</a>";
                else if ((record.data.Title == "Служебная записка") && (value != null))
                    return "<a class='parentDocLink' href='" + notesWebUrl + "/DocLib/" + value.replace("/", "_") + "'>" + value + "</a>";
                else
                    return value;
            }
        }],
    });

    if (item.ParentDocID != null) {
        Ext.data.JsonP.request({// проверка количества позиций в документе основания. Если количество = 0 , то кнопка копирования из документа основания не выводится.
            url: apiUrl + 'ContractPosition/List',
            params: { ID: item.ParentDocID },
            timeout: 300,
            success: function (result, request) {
                CreatePaymentRequestPositionGrid(item, hasEditPermission, result.data.length)
            },
        });
    }
    else
        CreatePaymentRequestPositionGrid(item, hasEditPermission, 0);
}


function CreatePaymentRequestPositionGrid(item, hasEditPermission, parentDocPositionCount) {
    if(parentDocCost == null){
        var percentColumnIndex = paymentRequestBudgetPositionColumns.findIndex(function(item){ return item.dataIndex=="Percent"});
        paymentRequestPositionColumns.splice(percentColumnIndex,1);
    }
    // Таблица позиций договора
    var paymentRequestPositionGrid = new VK.Budget.Grid({
        id: 'paymentRequestPositionGrid',
        renderTo: Ext.getElementById("paymentRequestPositionContainer"),
        layout: { type: 'hbox', align: 'stretch' },
        scrollable: true,
        plugins: [{
            ptype: 'cellediting',
            clicksToEdit: 1
        },
        {
            ptype: 'rowwidget',
            widget: {
                xtype: 'grid',
                preventHeader: true,
                layout: { type: 'hbox', align: 'stretch' },
                scrollable: true,
                plugins: [{
                    ptype: 'cellediting'
                }],
                flex: 1,
                columns: paymentRequestBudgetPositionColumns,
                store: {
                    type: 'PaymentRequest_BudgetPosition_Store' // создание отдельного хранилища для каждого экземпляра grid
                },
                listeners: {//edit: ContractBudgetPosition_Edit
                },
                tbar: [],
                plugins: [{
                    ptype: 'cellediting',
                    clicksToEdit: 1
                }],
                listeners: {
                    'cellclick': function (grid, cell, columnIndex, record, node, rowIndex, evt) {
                        var text = grid.getHeaderCt().getHeaderAtIndex(columnIndex).text;
                        if (text == "Код" || text == "Бюджетная позиция") // открытие окна проверки при нажатии на ячейку
                            PaymentRequest_BudgetPosition_ShowCheckWindow(record);
                    },
                    beforeedit: function (e, editor) {
                        if (e.grid.hasEditPermission == false)
                            return false;
                    },
                    edit: PaymentRequest_BudgetPosition_Edit
                },
                // кастомные свойства, заполняются из родительского grid при раскрытии rowwidget 
                parentPositionIndex: '',
                hasEditPermission: false,
                budgetCopyFlag: false,
                loaded: false, // признак того, что grid загружен
            },
            onWidgetAttach: PaymentRequest_Position_onWidgetAttach
        }
        ],
        store: Ext.data.StoreManager.lookup('paymentRequest_Position_Store'),
        columns: paymentRequestPositionColumns,
        tbar: [],
        listeners: {
            beforerender: function () {
                PaymentRequest_Position_AddButtons(this, item, hasEditPermission);
            },
            beforeedit: function (e, editor) {
                if (e.grid.hasEditPermission == false)
                    return false;
            },
            edit: PaymentRequest_Position_Edit
        }, // кастомные свойства
        hasEditPermission: false, // признак редактируемости данных
        parentDocId: item.ParentDocID, // ИД документа основания
        //parentDocType: item.Type, //  тип документа основания
        budgetCopyFlag: item.BudgetCopyFlag1 != null ? Boolean.parse(item.BudgetCopyFlag1) : false, // признак копирования из документа основания
        itemId: item.ID, // ИД заявки
        parentDocPositionCount: parentDocPositionCount, // количество позиций в документе основания
    });
}

// Столбцы позиций заявки на оплату
var paymentRequestPositionColumns = [{
    header: '№',
    flex: 1,
    dataIndex: 'Number'
}, {
    header: 'Наименование',
    flex: 4,
    dataIndex: 'Title',
    tdCls: 'contractPositionTitle',
    editor: {
        xtype: 'textfield',
        allowBlank: false,
    }
},{
    text: '%',
    dataIndex: 'Percent',
    xtype: 'numbercolumn',
    flex: 1,
    editor: { xtype: 'textfield' }
},{
    header: 'Стоимость',
    flex: 2,
    dataIndex: 'Cost',
    xtype: 'numbercolumn',
    editor: {
        xtype: 'numberfield',
        allowBlank: false,
        useThousandSeparator: false,
        decimalSeparator: ','
    },
}, {
    header: 'БОС',
    flex: 1,
    dataIndex: 'BOS',
    xtype: 'checkcolumn',
    processEvent: function () { return false; },
    editor: {
        xtype: 'checkbox',
        cls: 'x-grid-checkheader-editor'
    },
}, {
    xtype: 'actioncolumn',
    width: 30,
    items: [{
        icon: '/Style Library/Images/clear.png',
        handler: function (grid, rowIndex, colIndex) {
            Ext.data.StoreManager.lookup('paymentRequest_Position_Store').removeAt(rowIndex);
        }
    }]
}];

var budgetCheckGridColumns = [{
    text: '',
    dataIndex: 'Type',
    flex: 1
}, {
    text: 'Период 1',
    dataIndex: 'Period1',
    flex: 1
}, {
    text: 'Период 2',
    dataIndex: 'Period2',
    flex: 1
}, {
    text: 'Период 3',
    dataIndex: 'Period3',
    flex: 1
}]

// Столбцы бюджетных позиций заявки на оплату 
var paymentRequestBudgetPositionColumns = [
    {
        text: 'Код',
        dataIndex: 'Code',
        flex: 1
    },
    {
        text: 'Бюджетная позиция',
        dataIndex: 'Title',
        flex: 4
    },{
        text: '%',
        dataIndex: 'Percent',
        xtype: 'numbercolumn',
        flex: 1,
        editor: { xtype: 'textfield' }
    },{
        text: 'Сумма',
        dataIndex: 'Cost',
        xtype: 'numbercolumn',
        flex: 2,
        editor: {
            xtype: 'numberfield',
            useThousandSeparator: false,
            decimalSeparator: ',',
            listeners: {
                edit: function (editor, e, eOpts) { },
                change: function (field, e) { }
            },
        }
    }, {
        text: 'БОС',
        xtype: 'checkcolumn',
        dataIndex: 'BOS',
        flex: 1,
        processEvent: function () { return false; },
        editor: {
            xtype: 'checkbox',
        },
    }, {
        text: 'Проверка',
        xtype: 'actioncolumn',
        flex: 1,
        dataIndex: 'BudgetCheck',
        renderer: function (value, metaData, record, row, col, store, gridView) {
            if (col == null)
                return;
            if (record.get('BudgetCheck') == true) {
				//
                gridView.grid.columns[col].items[0].iconCls = 'positiveCheckResultIcon';
            } else {
				//
                gridView.grid.columns[col].items[0].iconCls = 'negativeCheckResultIcon';
            }
        },
    }, {
        xtype: 'actioncolumn',
        width: 30,
        items: [{
            icon: '/Style Library/Images/clear.png',
            handler: function (grid, rowIndex, colIndex) {
                grid.store.removeAt(rowIndex);
            }
        }]
    }];


