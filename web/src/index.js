class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sql: '', result: '' };
  }

  randomNumbers() {
    axios.post('/random-numbers')
    .then(({data}) => {
      console.log(data)
      this.setState({ sql: data.sql, result: data.result.join() })
    })
  }

  getRandomNumbers() {
    axios.get('/random-numbers2')
    .then(({data}) => {
      console.log(data)
      this.setState({ sql: data.sql, result: data.result.map(({number}) => number).join() })
    })
  }

  clearNumbers() {
    axios.delete('/clear-numbers')
    .then(({data}) => {
      console.log(data)
      this.setState({ sql: data.sql, result: data.result.join() })
    })
  }

  render() {
    return (
      <div>
        <div>
          <b>SQL:</b><br/>
          <span>{this.state.sql}</span>
        </div>
        <div>
        <b>Result:</b><br/>
          <span>{this.state.result}</span>
        </div>
        <button onClick={() => this.randomNumbers()}>
          Random Numbers
        </button>
        <button onClick={() => this.getRandomNumbers()}>
          Get Random Numbers
        </button>
        <button onClick={() => this.clearNumbers()}>
          Clear Numbers
        </button>
      </div>
    );
  }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(React.createElement(LikeButton), domContainer);