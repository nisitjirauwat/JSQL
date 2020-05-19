class Main extends React.Component {
  constructor(props) {
    super(props)
    this.state = { data: null, name: location.search.replace('?q=', '') };
  }

  componentWillMount() {
    this.loadData ();
  }

  loadData() {
    axios.get(`/data/${this.state.name}`)
    .then(({data}) => {
      console.log(data)
      this.setState({ data })
    })
  }

  saveData() {
    axios.put(
      `/data/${this.state.name}`,
      {tables: this.state.data},
      {
        headers: {'Content-Type': 'application/json'}
      }
    )
    .then(({data}) => {
      console.log(data)
    })
  }

  saveDataAndGenerateSQL() {
    axios.post(
      `/data/${this.state.name}`,
      {tables: this.state.data},
      {
        headers: {'Content-Type': 'application/json'}
      }
    )
    .then(({data}) => {
      console.log(data)
    })
  }

  updateTable(table, index) {
    const tables = this.state.data
    tables[index] = table
    this.setState({ data: tables })
  }

  render() {
    return (
      <div class="container">
        {
          this.state.data
          ? this.state.data.map ((table, index) => <MyTable
            table={table}
            tables={this.state.data}
            tableIndex={index}
            updateTable={this.updateTable.bind(this)}/>)
          : null
        }
        <div class="buttons">
          <button class="button is-primary" onClick={() => this.saveData()}>Save</button>
          <button class="button is-success" onClick={() => this.saveDataAndGenerateSQL()}>{"Save & Generate SQL"}</button>
        </div>
      </div>
    );
  }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(React.createElement(Main), domContainer);


class MyTable extends React.Component {
  constructor(props) {
    super(props)
    this.state = { };
  }

  handleChange(rowIndex, columnIndex) {
    return (e) => {
      const values = this.props.table.values
      values[rowIndex][columnIndex].value = e.target.value
      this.props.updateTable ({...this.props.table, values }, this.props.tableIndex)
    }
  }

  handleSelectChange(rowIndex, columnIndex) {
    return (e) => {
      const values = this.props.table.values
      values[rowIndex][columnIndex].ref_row = parseInt (e.target.value)
      this.props.updateTable ({...this.props.table, values }, this.props.tableIndex)
    }
  }

  generateHead() {
    return this.props.table.columns
      .map (column => <th key={`${this.props.table.table_name}-${column.name}`} ><abbr title={column.name}>{column.name}</abbr></th>)
  }

  generateBody() {
    return this.props.table.values
      .map ((values, rowIndex) => {
        return <tr key={`${this.props.table.table_name}-tr-${rowIndex}`}>
          {
            values.map ((value, index) => {
              if (this.props.table.columns[index].has_ref) {
                const column = this.props.table.columns[index]
                const ref = this.props.tables.find(t => t.table_name == column.ref.table && t.service == column.ref.service)
                const refColumnIndex = ref.columns.findIndex(c => c.name == column.ref.column)

                return <td key={`${this.props.table.table_name}-td-${rowIndex}-${index}`}>
                  {this.generateRefDropdown(value.ref_row, ref, rowIndex, index, refColumnIndex)}
                  {ref.values[value.ref_row][refColumnIndex].value}
                </td>
              } else {
                return <td key={`${this.props.table.table_name}-td-${rowIndex}-${index}`}>
                  <input class="input" type="text" value={value.value} onChange={this.handleChange(rowIndex, index)}></input>
                </td>
              }
            })
          }
          <td key={`${this.props.table.table_name}-delete-${rowIndex}`}>
            <button class="button is-danger" onClick={() => this.RemoveBody(rowIndex)}>Remove</button>
          </td>
        </tr>
      })
  }

  generateRefDropdown(refRow, ref, rowIndex, columnIndex, refColumnIndex) {
    return <div class="control" key={`${this.props.table.table_name}-option-${rowIndex}-${columnIndex}-${refColumnIndex}`}>
        <div class="select">
          <select value={refRow} onChange={this.handleSelectChange(rowIndex, columnIndex)}>
            { 
              ref.values.map ((_, index) =>
            <option key={`${this.props.table.table_name}-option-${rowIndex}-${columnIndex}-${refColumnIndex}-${index}`} value={index}>{`${ref.table_name}(${index})`}</option>
              )
            }
          </select>
        </div>
    </div>
  }

  AddBody() {
    const mainValues = this.props.table.values

    const values = this.props.table.columns
      .map (column => {
        return column.has_ref ? { "ref_row": 0, "value": "" } : {"value": "" }
      })
  
    mainValues.push (values)
    this.props.updateTable ({...this.props.table, values: mainValues }, this.props.tableIndex)
  }

  RemoveBody(index) {
    const mainValues = this.props.table.values
    mainValues.splice(index, 1)
    this.props.updateTable ({...this.props.table, values: mainValues }, this.props.tableIndex)
  }

  render() {
    return (
      <section style={{marginBottom: "32px"}}>
        <div><span class="tag is-success">{this.props.table.service}</span><span class="tag is-primary">{this.props.table.table_name}</span></div>
        <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead>
            <tr>
              {this.generateHead()}
            </tr>
          </thead>
          <tbody>
            {this.generateBody()}
          </tbody>
        </table>
        <button class="button is-link" onClick={() => this.AddBody()}>Add</button>
      </section>
    );
  }
}