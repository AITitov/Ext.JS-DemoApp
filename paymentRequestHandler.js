//#region PaymentRequest_Position
// Добавление позиции заявки на оплату в хранилище
function PaymentRequest_Position_Add() {
    var store = Ext.data.StoreManager.lookup('paymentRequest_Position_Store');
    var newItem = Ext.create('PaymentRequest_Position', {
        Number: store.getCount() + 1,
        Title: '',
        Percent: '0',
        Cost: '0',
    });
    store.insert(store.getCount() + 1, newItem);
    store.reload();
}

function PaymentRequest_Position_Edit(editor, e, eOpts) {
    var sum = e.grid.parentDocCost != null ?  e.grid.parentDocCost: e.grid.store.data.sum("Cost");
    if (e.column.dataIndex == "Percent")
        SetCostValueByPercent(sum, e.record);
    if (e.field == "Cost") {
        SetPercentValueByCost(sum, e.record);
        PaymentRequest_SetSum(e.grid); // обновление надписи с заявленной суммой
        e.grid.getView().refresh();
        PaymentRequest_UpdatePaymentSumField(); // обновление поля заявленной суммы в заявке
        //CheckCostDifference(sum, e.grid.store, e.grid);
    }
}


// Отрисовка кнопок в зависимости от наличия прав на редактирования и признака копирования бюджетных позиций
function PaymentRequest_Position_AddButtons(grid, item, hasEditPermission) {
    grid = Ext.getCmp(grid.id);
    if (!hasEditPermission){
        grid.columnManager.getLast().destroy();
        grid.down('toolbar').add('->');
        grid.down('toolbar').add({ id: 'sumLabel', xtype: 'label', html: '' });
        PaymentRequest_SetSum(grid);
        return;
    }
    Ext.getCmp(grid.id).hasEditPermission = true;
    LockManualAdditionBudgetPostition(grid.budgetCopyFlag,grid);
}

function PaymentRequest_SetSum(grid){ // Обновление надписи "Заявленная сумма оплаты"
    Ext.getCmp("sumLabel").setHtml("Заявленная сумма оплаты: "+ grid.store.sum("Cost").toFixed(2));
}

function PaymentRequest_UpdatePaymentSumField(){ // Обновление поля "Заявленная суммы оплаты" заявки
    var paymentRequestID = Ext.Object.fromQueryString(location.search).ID; // ID элемента
    var web = new $pnp.Web(paymentRequestWebUrl);
    web.lists.getByTitle(listTitle).items.getById(paymentRequestID).update({
        // PaymentStatus: 'Согласовано',
        // PaymentSumApproved: Ext.getCmp("paymentRequestPositionGrid").getStore().sum("Cost"),
        PaymentSum: Ext.getCmp("paymentRequestPositionGrid").getStore().sum("Cost"),
    }).then(function () {
        // window.location.reload();
    });
}

// Функция при раскрытии позиции заявки
function PaymentRequest_Position_onWidgetAttach(plugin, grid, record) {
    var id = { ParentPositionID: record.data.ID };
    grid.parentPositionIndex = record.data.Number - 1;
    grid.hasEditPermission = plugin.grid.hasEditPermission;
    grid.parentDocType = plugin.grid.parentDocType;
    grid.budgetCopyFlag = plugin.grid.budgetCopyFlag;
    if((grid.budgetCopyFlag == false)&&(grid.hasEditPermission == true)&&(grid.loaded != true)){
        grid.down('toolbar').add({ text: 'Бюджет', handler: PaymentRequest_BudgetPosition_Add });
        grid.down('toolbar').add({ text: 'Вне бюджета', handler: PaymentRequest_BudgetPosition_Add });
    }
    
    if((grid.loaded == false)&&(grid.hasEditPermission == false)){ // удаление столбца 
        grid.columnManager.getLast().destroy();
    }

    if(grid.loaded != true)
        grid.loaded = true;

    grid.getStore().proxy.setExtraParams(id);
    grid.getStore().on('load', function () {
        setTimeout(function () {
            CheckCostDifference(record.data.Cost, grid.store, grid);
            SetPercentStore(record.data.Cost, grid.store);
            grid.getView().refresh();
        }, 1);
        
    });
    grid.getStore().reload();
    //CheckCostDifference(record.data.Cost,grid.getStore(),grid);
}

function PaymentRequest_BudgetCheck(btn, e) {
    Ext.data.JsonP.request({
        url: apiUrl + 'PaymentRequest/CheckBudget',
        params: { PaymentRequestID: Ext.Object.fromQueryString(location.search).ID },
        timeout: 300,
        callback: function () {
            btn.up().up().store.reload();
            var st = SP.UI.Status.addStatus("Проверка по бюджету успешно выполнена");
            SP.UI.Status.setStatusPriColor(st, 'green');
            setTimeout(function () { }, 800);
        }
    });
}

//#endregion

//#region PaymentRequest_BudgetPosition

function PaymentRequest_BudgetPosition_Edit(editor, e, eOpts) {
    var sum = Ext.data.StoreManager.lookup('paymentRequest_Position_Store').getAt(e.grid.parentPositionIndex).data.Cost;

    if (e.column.dataIndex == "Percent") {
        SetCostValueByPercent(sum, e.record);
    }
    if (e.column.dataIndex == "Cost") {
        SetPercentValueByCost(sum, e.record);
    }
    CheckCostDifference(sum, e.grid.store, e.grid);
}

// Обработчик кнопки Бюджет/Вне бюджет
function PaymentRequest_BudgetPosition_Add(btn, e) {
    var budgetFlag = false;
    if (btn.text == "Бюджет") {
        budgetFlag = true;
    }
    var selectedParentPositionIndex = btn.up('gridview').indexOf(btn.el.up('table'));
    var parentPositionStore = Ext.data.StoreManager.lookup('paymentRequest_Position_Store');
    var addBudgetPositionWindow = Ext.create('Ext.window.Window', {
        title: 'Добавить бюджетную позицию',
        id: 'addBudgetPositionWindow',
        scrollable: true,
        width: 600,
        height: 420,
        items: [new VK.Budget.TreePanel({
            id: 'budgetPositionTreePanel',
        })],
        buttons: [
            {
                text: 'Добавить',
                handler: function () {
                    var selectedNodeData = Ext.getCmp("budgetPositionTreePanel").getSelectionModel().getSelection()[0].data;
                    var parentPositionID = parentPositionStore.getAt(selectedParentPositionIndex).data.ID
                    var budgetPosition = Ext.create('PaymentRequest_BudgetPosition', {
                        Code: selectedNodeData.code,
                        Title: selectedNodeData.title,
                        Cost: 0,
                        BOS: false,
                        ParentPositionID: parentPositionID,
                        BudgetPositionID: selectedNodeData.id,
                    });
                    budgetPosition.save();
                    btn.up().up().store.add(budgetPosition);
                    btn.up().up().store.reload();
                    Ext.getCmp("addBudgetPositionWindow").close();
                }
            },
            {
                text: 'Отмена',
                handler: function () {
                    Ext.getCmp("addBudgetPositionWindow").close();

                }
            }
        ],
        listeners: {
            close: function () {
                //SwitchToolbarButtonDisable(toolbar,false);
            },
        }
    });
    addBudgetPositionWindow.show();

    var webUrl = "/MDM";
    var web = new $pnp.Web(webUrl);
    web.lists.getByTitle("Бюджетные позиции").items.top(2000).orderBy("SortedCode").get().then(function (items) {
        Ext.tip.QuickTipManager.init();
        var budgetPositionItems = ParseBudgetPositions(items);
        var treeStore = Ext.getCmp("budgetPositionTreePanel").getStore();
        treeStore.getProxy().setData(budgetPositionItems);
        treeStore.load();
    });
}

// Открытие окна проверки бюджетной позиции
function PaymentRequest_BudgetPosition_ShowCheckWindow(record) {
    if (Ext.getCmp("checkBudgetPositionWindow") != undefined)
        return;
    var checkBudgetPositionWindow = Ext.create('Ext.window.Window', {
        title: record.data.Code + " " + record.data.Title,
        id: 'checkBudgetPositionWindow',
        scrollable: true,
        width: 510,
        height: 490,
        resizable: false,
        items: [{ html: "" }],
        buttons: [{
                text: 'Закрыть',
                handler: function () {
                    Ext.getCmp("checkBudgetPositionWindow").close();
                },}
        ],
    });
    checkBudgetPositionWindow.show();
    PaymentRequest_BudgetPosition_SetCheckData(checkBudgetPositionWindow, record)
}


//#endregion

//#region CopyBudgetPosition

// Переключение признака копирования бюджетных позиций
// newValue - новое значение признака, itemId/listName/webUrl - ид/название списка/адрес сайта элемента, grid - текущий компонент
function SwitchBudgetCopyFlag(value, itemId, listName, webUrl, grid) {
    var web = new $pnp.Web(webUrl);
    web.lists.getByTitle(listName).items.getById(itemId).update({
        BudgetCopyFlag1: value.toString()
    }).then(function () {
        grid.store.reload();
    })
}

// Изменение кнопок в зависимости от значения признака копирования бюджетных позиций
// value - значение признака копирования, grid - текущий компонент 
function LockManualAdditionBudgetPostition(value, grid) {
    grid.down('toolbar').removeAll();
    if ((value != undefined) && (value == true)) {
        grid.down('toolbar').add({ text: 'Скопировать недостающие позиции', id: 'copyMissedBudgetPositionButton', handler: CopyBudgetPositionFromMainDocument });
        Ext.getCmp(grid.id).budgetCopyFlag = true;
    }
    else {
        if(grid.parentDocId == null)
            grid.down('toolbar').add({ text: 'Добавить позицию заявки', id: 'addBudgetPositionButton', handler: PaymentRequest_Position_Add });
        else
            grid.down('toolbar').add({ text: 'Скопировать из документа основания', id: 'copyBudgetPositionButton', handler: CopyBudgetPositionFromMainDocument });
        //if(grid.parentDocPositionCount != 0)
        
        Ext.getCmp(grid.id).budgetCopyFlag = false;
    }
    grid.down('toolbar').add({ text: 'Проверка',handler:PaymentRequest_BudgetCheck });
    grid.down('toolbar').add('->');
    grid.down('toolbar').add({ id: 'sumLabel', xtype: 'label', html: '' });
    PaymentRequest_SetSum(grid);

    grid.getView().refresh();
}

function CopyBudgetPositionFromMainDocument(btn) {
    var grid = btn.up().up();
    Ext.data.JsonP.request({
        url: apiUrl + 'PaymentRequest_Position/CopyBudget',
        params: { ParentDocID: grid.parentDocId, PaymentRequestID: grid.itemId },
        timeout: 300,
        callback: function () {
            if (grid.budgetCopyFlag != true){
                LockManualAdditionBudgetPostition(true, grid);
                SwitchBudgetCopyFlag(true,grid.itemId,encodeURI("Заявки на оплату"),"/sites/Treasury",grid)
            }
            grid.store.reload();
            
        }
    });
}

//#endregion

//#region Utils

// Удаление столбца из grid
function removeColumn(grid, colName, colIndex) {
    this.store.removeField(name);
    if (typeof colIndex != 'number') {
        colIndex = this.colModel.findColumnIndex(colName);
    }
    if (colIndex >= 0) {
        this.colModel.removeColumn(colIndex);
    }
}

// Выбор списка полей в реквизитах заявки
function GetDocsetFieldArray(item) {
    var fields = [];
    switch (item.Type) {
        case "Без основания":
            break;
        case "Договор":
            fields.push("Contract");
            break;
        case "ДС":
            fields.push("DS");
            break;
        case "Закрывающий документ":
            fields.push("ClosingDoc");
            break;
    }
    
    fields.push.apply(fields, ["Note", "PaymentType", "PaymentPlannedDate","PaymentActualDate","PaymentSumFact", "Entity"]);
    //...
    fields.push.apply(fields, ["CFO","Counteragent","PaymentStatus","PaymentNote"]);
    return fields;
}

//#endregion