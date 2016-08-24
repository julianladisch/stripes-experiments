import React, { Component, PropTypes } from 'react';
import { connect } from 'stripes-connect';
import ModuleForm from './ModuleForm';


class ModuleEdit extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static manifest = { 'modules': { type: 'okapi',
                                   path: '_/proxy/modules/:moduleid'
                                 }
                    };

  update(data) {
    this.props.mutator['modules'].update(data);
    this.context.router.push('/okapi-console/modules/list');
  }

  cancel(data) {
    this.context.router.push('/okapi-console/modules/list');
  }

  
  render() {
    let moduleid = this.props.params.moduleid;
    let modules = this.props.data['modules']
    let module = modules.find((module) =>  { return module.id === moduleid });

    return <ModuleForm onSubmit={this.update.bind(this)} 
                       cancelForm={this.cancel.bind(this)} 
                       submitLabel='Save'
                       initialValues={module} />
  }
}

export default connect(ModuleEdit, 'okapi-console');
