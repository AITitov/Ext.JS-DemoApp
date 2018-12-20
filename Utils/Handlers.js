//#region EditForm (черновая версия методов для кастомной editForm, на данный момент не используется)
// заполнение массива столбцов
function SetEditFormFields(form) {
    var web = new $pnp.Web(form.webUrl);
    web.lists.getByTitle(form.listTitle).items.getById(form.itemID).get().then(function (item) {
        web.lists.getByTitle(form.listTitle).fields.get().then(function (fields) {
            if (form.fields != undefined) {
                for (var i = 0; i < form.fields.length; i++) {
                    var field = fields.filter(function (obj) {
                        return obj.StaticName == form.fields[i];
                    });
                    //form.add({ fieldLabel: field[0].Title, value: renderField(field[0], item[form.fields[i]]) });
                    var test = renderEditField(field[0], item[form.fields[i]]);
                    form.add(test);
                }
            }
        });
    });
}
// обработка поля для формы редактирования
function renderEditField(field, value) {
    switch (field.TypeAsString) {
        case "DateTime":
            return renderEditDateField(field.Title, value);
            break;
        case "Boolean":
            return renderEditBooleanField(field.Title, value);
            break;
        default:
            return renderEditTextField(field.Title, value);
            break;
    }
}
// singleTextField
function renderEditTextField(title, value) {
    var result = [{
        xtype: 'textfield',
        fieldLabel: title,
        value: value
    }]
    return result;
}
// booleanField
function renderEditBooleanField(title, value) {
    var result = [{
        xtype: 'checkbox',
        fieldLabel: title,
        value: value
    }]
    return result;
}
// dateTimeField
function renderEditDateField(title, value) {
    var result = [{
        xtype: 'datefield',
        fieldLabel: title,
        value: value
    }]
    return result;
}
//#endregion


//#region DocSetProperties & DispForm
// методы для работы с компонентами VK.WebParts.DocSetProperties и VK.WebParts.DispForm, которые используются в заявках на оплату

// вывод кнопок в зависимости от прав текущего пользователя
function checkCurrentUserEditPermission(grid) {
    var web = new $pnp.Web(grid.webUrl);
    web.lists.getByTitle(grid.listTitle).items.getById(grid.itemID).currentUserHasPermissions(3).then(function (result) {
        if ((result == true) && (grid.editFormUrl != null))
            grid.down('toolbar').add({ text: 'Изменить', handler: DocSetPropertiesClick, iconCls: 'editPropertiesButton' });
        if (grid.dispFormUrl != null)
            grid.down('toolbar').add({ text: 'Просмотреть все', handler: DocSetPropertiesClick, iconCls: 'viewPropertiesButton' });
    });
}

// вывод свойств доксета 
function loadDocsetProperties(grid) {
    var web = new $pnp.Web(grid.webUrl);
    web.lists.getByTitle(grid.listTitle).items.getById(grid.itemID).get().then(function (item) {
        web.lists.getByTitle(grid.listTitle).fields.get().then(function (fields) {
            //console.log(fields);
            if (grid.fields != undefined) { // выводится указанный при инициализации компонента перечень полей
                for (var i = 0; i < grid.fields.length; i++) {
                    var field = fields.filter(function (obj) {
                        return obj.StaticName == grid.fields[i];
                    });
                    grid.store.add({ Title: field[0].Title, Value: renderField(field[0], item) });
                }
            } else { // выводятся все видимые поля
                var visibleFields = fields.filter(function (obj) {
                    return obj.Hidden == false && obj.ReadOnlyField == false;
                });
                for (var i = 0; i < visibleFields.length; i++) {
                    if (item[visibleFields[i].StaticName] != null)
                        grid.store.add({ Title: visibleFields[i].Title, Value: renderField(visibleFields[i], item) });
                }
            }
            grid.getView().refresh();
        });
    });
}

function DocSetPropertiesClick(btn, e) {
    if (btn.text == "Изменить")
        SP.UI.ModalDialog.ShowPopupDialog(btn.up().up().editFormUrl);
    if (btn.text == "Просмотреть все")
        ShowModal(btn.up().up().dispFormUrl, "Реквизиты заявки",600,600);
    //SP.UI.ModalDialog.ShowPopupDialog(btn.up().up().dispFormUrl);
}

function renderField(field, item) {
    switch (field.TypeAsString) {
        case "DateTime":
            return renderDateField(item[field.InternalName]);
            break;
        case "Boolean":
            return renderBooleanField(item[field.InternalName]);
            break;
        case "UserMulti":
            return renderUserMultiField(item, field);
            break;
        default:
            //return item[field.InternalName];
            return item[field.EntityPropertyName];
            break;
    }
}

function renderBooleanField(value) {
    if (value == true)
        return "Да";
    else
        return "Нет";
}
function renderDateField(value) {
    if (value != "" && value != null) {
        var date = new Date(value);
        return (date.getDate().toString().length == 1 ? "0" + date.getDate() : date.getDate()) + "." +
            ((date.getMonth() + 1).toString().length == 1 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)) + "." + date.getFullYear()
    }
    else
        return "";
}

function addUserMultiField(grid, item, fieldTitle, fieldName, webUrl) {
    var idArrayField = fieldName + "Id";
    var queryText = "";
    if(item[idArrayField] == null){
        var fieldItem = { Title: fieldTitle, Value: "" }
        grid.getStore().insert(grid.fields.length, fieldItem);
        grid.getView().refresh();
        return;
    }
        
    for (var i = 0; i < item[idArrayField].length; i++) {
        queryText += "Id eq " + item[idArrayField][i];
        if (i != item[idArrayField].length - 1)
            queryText += " or ";
    }
    var resultText = "";
    var web = new $pnp.Web(webUrl);
    web.siteUsers.filter(queryText).get().then(function (items) {
        for (var i = 0; i < items.length; i++) {
            resultText += items[i].Title + "; ";
        }
        var fieldItem = { Title: fieldTitle, Value: resultText }
        grid.getStore().insert(grid.fields.length, fieldItem);
        grid.getView().refresh();
    });
}

//#endregion

//#region Utils (вспомогательные методы)

// Функция открытия модального окна с параметрами
function ShowModal(url,title,width,height){	
    var options = { url:url, title:title,width:width,height:height};
    SP.UI.ModalDialog.showModalDialog(options);
}



//#endregion