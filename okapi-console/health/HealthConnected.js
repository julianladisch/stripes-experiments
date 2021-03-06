import React, { Component } from 'react';
import fetch from 'isomorphic-fetch';
import { connect } from 'stripes-connect';

class Row extends Component {
  render() {
    const { instId, srvcId, healthMessage, healthStatus } = this.props.h;

    let href = "#/okapi-console/modules/edit/" + srvcId;
    return <tr>
      <td>{instId}</td>
      <td><a href={href}>{srvcId}</a></td>
      <td>{this.props.map[srvcId]}</td>
      <td>{healthMessage}</td>
      <td>{healthStatus ? "true" : "false"}</td>
    </tr>
  }
}

class Health extends Component {
  static manifest = { 'health':   { type: 'okapi',
                                    pk:   'srvcId',
                                    path: '_/discovery/health' },
                      'modules' : { type: 'okapi',
                                    path: '_/proxy/modules' }};

  render() {
    const { health, modules } = this.props.data;

    if (!health) {
      return <div/>
    }

    console.log("Health.render: ",
                "health = " + typeof(health) + ": ", health, "; ",
                "modules = " + typeof(modules) + ": ", modules);
    let moduleId2name = {};
    if (modules) {
      for (let i = 0; i < modules.length; i++) {
        let module = modules[i];
        moduleId2name[module.id] = module.name;
      }
    }

    return <table>
             <thead>
              <tr>
               <th>Instance ID</th>
               <th>Service ID</th>
               <th>Module Name</th>
               <th>Message</th>
               <th>Status</th>
              </tr>
             </thead>
             <tbody>
              {health.map((h, index) => { return <Row key={index} h={h} map={moduleId2name}/> })}
             </tbody>
            </table>
  }
}

export default connect(Health, 'okapi-console');