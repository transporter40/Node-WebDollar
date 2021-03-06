/* Added by Silviu Bogdan Stroe - https://www.silviu-s.com */
/* Edited by Cosmin-Dumitru Oprea */

import consts from 'consts/const_global'

const atob = require('atob');
const btoa = require('btoa');
import MainBlockchain from 'main-blockchain/Blockchain';
import StatusEvents from "common/events/Status-Events";

let pounchdb = (process.env.BROWSER) ? (require('pouchdb').default) : (require('pouchdb-node'));

class InterfaceSatoshminDB {

    constructor(databaseName = consts.DATABASE_NAMES.DEFAULT_DATABASE) {

        this.dbName = databaseName;

        try {
            this.db = new pounchdb(this.dbName);
        } catch (exception){
            console.error("InterfaceSatoshminDB exception", pounchdb);
        }

    }

    async _createDocument(key, value) {

        await this._deleteDocumentAttachmentIfExist(key);

        try {
            let response = await this.db.put({_id: key, value: value});

            return true;
        } catch (err) {
            if (err.status === 409)
                return await this._updateDocument(key, value);
            else {
                console.error("_createDocument raised exception", key, err);
                throw err;
            }
        }

    }

    async _updateDocument(key, value) {

        try {
            let doc = await this.db.get(key);

            let response = await this.db.put({
                _id: doc._id,
                _rev: doc._rev,
                value: value
            });

            return true;
        } catch (exception) {
            console.error("_updateDocument error" + key, exception);
            throw exception;
        }

    }

    async _getDocument(key) {

        try {
            let response = await this.db.get(key, {attachments: true});

            if (response._attachments === undefined) {
                return response.value;
            } else {
                //get attachment
                return new Buffer(atob(response._attachments.key.data).toString('hex'), 'hex');
            }

        } catch (Exception) {

            if (Exception.status === 404) //NOT FOUND
                return null;
            else {
                console.error("error _getDocument ", Exception);
                throw Exception;
            }
        }

    }

    async _deleteDocument(key) {

        try {
            let doc = await this.db.get(key, {attachments: true});

            let response = await this.db.remove(doc._id, doc._rev);

            return true;

        } catch (err) {
            if (err.status === 404) //NOT FOUND
                return null;
            else {
                console.error("_deleteDocument raised an error ", key);
                return err;
            }
        }

    }

    async _saveDocumentAttachment(key, value) {

        let attachment = value;
        // we need blob in browser
        if (process.env.BROWSER && Buffer.isBuffer(value)){
            attachment = new Blob([value.toString('hex')]);
        } else { //we are in node
            attachment = new Buffer(value.toString('hex'));
        }

        try {

            await this._createDocument(key, null);

            let result = await this.db.put({
                _id: key,
                _attachments: {
                    key: {
                        content_type: 'application/octet-binary',
                        data: attachment
                    }
                }
            });

            return true;

        } catch (err) {


            if (err.status === 409) {
                return await this._updateDocumentAttachment(key, attachment);
            } else {
                if (err.status === 404) {

                    //if document not exist, create it and recall attachment
                    try {
                        let response = this._createDocument(key, null);

                        return await this._saveDocumentAttachment(key, value);
                    } catch (exception) {

                        console.error('_saveDocumentAttachment raised an error for key ' + key, exception);
                    }

                } else {
                    console.error('_saveDocumentAttachment 222 raised an error for key ' + key, err);
                    throw err;
                }
            }

        }

    }

    async _updateDocumentAttachment(key, value) {

        try {
            let doc = await this.db.get(key, {attachments: true});

            try {
                let reuslt = await this.db.put({
                    _id: doc._id,
                    _attachments: {
                        key: {
                            content_type: 'application/octet-binary',
                            data: value
                        }
                    },
                    _rev: doc._rev
                });
                return true;
            } catch (err) {
                console.error("error _updateDocumentAttachment1 " + key, err);
                throw err;
            }


        } catch (err) {
            console.error("error _updateDocumentAttachment2  " + key, err);
            throw err;
        }
    }

    async _deleteDocumentAttachment(key) {
        try {
            let doc = await this.db.get(key);

            let result = await this.db.removeAttachment(doc._id, this.dbName, doc._rev);

            return true;

        } catch (exception) {
            return false;
            throw exception;
        }
    }

    async _deleteDocumentAttachmentIfExist(key) {

        try {
            let value = await this._getDocument(key);
            return await this._deleteDocumentAttachment(key);
        } catch (err) {
            console.error("_deleteDocumentAttachmentIfExist raised an error", err);
            return false;
        }
    }


    //main methods
    save(key, value, timeout=5000) {

        return new Promise(async (resolve)=>{

            //timeout, max 10 seconds to load the database
            let timeoutInterval = setTimeout(()=>{
                console.error("save failed !!"+ key, value);
                resolve(null);
            }, timeout);

            try {
                if (Buffer.isBuffer(value))
                    resolve(await this._saveDocumentAttachment(key, value));
                else
                    resolve(await this._createDocument(key, value));

                clearTimeout(timeoutInterval);
            } catch (exception) {
                console.error("db.save error " + key, exception);

                if (exception.status === 500)
                    StatusEvents.emit("blockchain/logs", {message: "IndexedDB Error", reason: exception.reason});

                resolve(null);
            }

        })
    }

    get(key, timeout=5000) {

        return new Promise((resolve)=>{

            //timeout, max 10 seconds to load the database
            let timeoutInterval = setTimeout(()=>{
                console.error("get failed !!" + key);
                resolve(null);
            }, timeout);

            this._getDocument(key).then((answer)=>{

                clearTimeout(timeoutInterval);
                resolve(answer);

            }).catch((exception)=>{

                clearTimeout(timeoutInterval);
                console.error("db.get error " + key, exception);

                if (exception.status === 500)
                    StatusEvents.emit("blockchain/logs", {message: "IndexedDB Error", reason: exception.reason});

                resolve(null);
            });

        })


    }

    async remove(key) {
        try {
            let result = await this._deleteDocument(key);
            return result;
        } catch (exception) {
            console.error("db.remove error " + key, exception);

            if (exception.status === 500)
                StatusEvents.emit("blockchain/logs", {message: "IndexedDB Error", reason: exception.reason});

            return null;
        }
    }

    close(){

        if (this.db !== undefined && this.db !== null)
            this.db.close();

    }

}

export default InterfaceSatoshminDB;