import fetch from 'isomorphic-fetch';
import crud from 'redux-crud';
import _ from 'lodash';
import uuid from 'node-uuid';

const defaultDefaults = { pk: 'id', clientGeneratePk: true, fetch: true };

export default class restResource { 

  constructor(name, query = {}, module = null, defaults = defaultDefaults)  {
    this.name = name;
    this.module = module;
    this.crudName = module ? `${module}_${name}` : name;
    // TODO: actual substitution of params/state
    this.optionsTemplate = _.merge({}, defaults, query);
    this.options = null;
    this.crudActions = crud.actionCreatorsFor(this.crudName);
    this.crudReducers = crud.reducersFor(this.crudName,
      { key: this.optionsTemplate.pk, store: crud.STORE_MUTABLE });
    // JavaScript methods are not bound to their instance by default
    this.reducer = this.reducer.bind(this);
  }

  getMutator(dispatch) {
    return { 
      'DELETE': record => { return dispatch(this.deleteAction(record)) },
      'PUT': record => { return dispatch(this.updateAction(record)) },
      'POST': record => { return dispatch(this.createAction(record)) }
    };
  }

  reducer(state = [], action) {
    switch (action.type) {
      // extra reducer (beyond redux-crud generated reducers) for clearing a list before populating from new fetch
      case 'CLEAR_' + this.stateKey().toUpperCase():
        return [];
      default:
        return this.crudReducers(state, action);
    }
  }
  
  stateKey() {
    return this.crudName;
  }

  refresh(dispatch, props) {
    // shallow copy; we'll need to go deeper once templating params
    this.options = {...this.optionsTemplate};
    if (this.options.fetch) {
      // TODO: still not really implemented
      if (this.options.path) {
        let sections = this.options.path.split("/");
        for (var i=0; i < sections.length; i++ ) {
          if (sections[i].startsWith(":")) {
            let section = sections[i].substring(1);
            // Substitute from component's router params, if found, otherwise from component's props
            sections[i] = ( (props.params && props.params[section]) ? props.params[section] : props[section]);
          }
        }
        this.options.path = sections.join("/");
      }
      dispatch(this.fetchAction());
    }
  }

  createAction(record) {
    const { root, path, pk, clientGeneratePk, headers, POST } = this.options;
    const crudActions = this.crudActions;
    const url = [ root, POST.path || path ].join('/');
    return function(dispatch) {
      // Optimistic record creation ('clientRecord')
      const cuuid = uuid();
      let clientRecord = { ...record, id: cuuid };
      clientRecord[pk] = cuuid;
      dispatch(crudActions.createStart(clientRecord));
      if (clientGeneratePk) {
        record[pk] = cuuid;
      }
      // Send remote record ('record')
      return fetch(url, {
        method: 'POST',
        headers: Object.assign({}, headers, POST.headers),
        body: JSON.stringify(record)
      })
        .then(response => {
          if (response.status >= 400) {
            dispatch(crudActions.createError(response, clientRecord));
          } else {
            response.json().then ( (json) => {
              if (json[pk] && !json.id) json.id = json[pk];
              dispatch(crudActions.createSuccess(json, cuuid));
            });
          }
        });
    }
  }

  updateAction(record) {
    const { root, path, pk, clientGeneratePk, headers, PUT } = this.options;
    const crudActions = this.crudActions;
    const url = [ root, PUT.path || path ].join('/');
    let clientRecord = record;
    if (clientRecord[pk] && !clientRecord.id) clientRecord.id = clientRecord[pk];
    return function(dispatch) {
      dispatch(crudActions.updateStart(clientRecord));
      return fetch(url, {
        method: 'PUT',
        headers: Object.assign({}, headers, PUT.headers),
        body: JSON.stringify(record)
      })
        .then(response => {
          if (response.status >= 400) {
            dispatch(crudActions.updateError(response,record));
          } else {
            /* Patrons api will not return JSON
            response.json().then ( (json) => {
              if (json[options.pk] && !json.id) json.id = json[options.pk];
              dispatch(crudActions.updateSuccess(json));
            });
            */
            dispatch(crudActions.updateSuccess(clientRecord));
          }
        });
    }
  }

  deleteAction(record) {
    const { root, path, pk, clientGeneratePk, headers, DELETE } = this.options;
    const crudActions = this.crudActions;
    const resolvedPath = DELETE.path || path;
    const url = (resolvedPath.endsWith(record[pk]) ?
                   [ root, resolvedPath ].join('/')
                   :
                   [ root, resolvedPath, record[pk] ].join('/'));
    return function(dispatch) {
      if (record[pk] && !record.id) record.id = record[pk];
      dispatch(crudActions.deleteStart(record));
      return fetch(url, {
        method: 'DELETE',
        headers: Object.assign({}, headers, DELETE.headers)
      })
        .then(response => {
          if (response.status >= 400) {
            dispatch(crudActions.deleteError(response, record));
          } else {
            dispatch(crudActions.deleteSuccess(record));
          }
        });
    }
  } 


  fetchAction() {
    const { root, path, pk, headers, GET, records } = this.options;
    const crudActions = this.crudActions;
    const key = this.stateKey();
    // i.e. only join truthy elements
    const url = [ root, path ].filter(_.identity).join('/');
    return function(dispatch) {
      dispatch(crudActions.fetchStart());
      return fetch(url, { headers: Object.assign({}, headers, GET.headers) })
        .then(response => {
          if (response.status >= 400) {
            dispatch(crudActions.fetchError(response));
          } else {
            response.json().then(json => {
              dispatch({ type: 'CLEAR_'+key.toUpperCase()});
              let data = (records ? json[records] : json);
              dispatch(crudActions.fetchSuccess(data));
            });
          }
        });
    };
  }
  
}
