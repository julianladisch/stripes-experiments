import React, { Component, PropTypes } from 'react';
import { connect } from 'stripes-connect';
import PatronForm from './PatronForm';
import { actionTypes } from './PatronForm';

// One of multiple stripes-connected components in the patrons module
class PatronEdit extends Component {

  // The manifest is provided in components by the module developer and consumed by 'stripes connect'
  static manifest = { 'patrons': { type: 'okapi',
                                   pk: '_id',  // The primary key of records from this end-point
                                               //  (when it's not the default, "id")
                                   path: 'apis/patrons/:patronid' // request parameter, provided by router
                                 }};

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  // Invokes the mutator provided by stripes connect to perform a PUT
  // Uses router object to navigate back to list
  updatePatron(data) {
    this.props.mutator['patrons'].PUT(data);
    this.context.router.push('/patrons/list');
  }

  cancel(data) {
    this.context.router.push('/patrons/list');
  }

  render() { 
      const { data: { patrons }, params: { patronid } } = this.props;

      let patron = patrons.find((patron) =>  { return patron._id === patronid });

      return <PatronForm onSubmit={this.updatePatron.bind(this)} 
        cancelForm={this.cancel.bind(this)}
        action={actionTypes['update']}
        initialValues={patron} />
  }
}

// This function call might be implicit in a future version (invoked by the framework)
export default connect(PatronEdit, 'patrons');
