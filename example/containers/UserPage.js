import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { loadUser, loadStarred } from '../actions';
import User from '../components/User';
import Repo from '../components/Repo';
import List from '../components/List';

class UserPage extends Component {
  constructor(props) {
    super(props);
    this.renderRepo = this.renderRepo.bind(this);
    this.handleLoadMoreClick = this.handleLoadMoreClick.bind(this);
  }

  render() {
    const { user, login } = this.props;
    if (!user) {
      return <h1><i>Loading {login}’s profile...</i></h1>;
    }

    const loadingStarred = `Loading ${login}’s starred...`;
    /**
     * user.stars:
     * {
     *   items: PropTypes.array
     *   isFetching: PropTypes.bool,
     *   loadMore: PropTypes.func,
     *   nextToken: PropTypes.string
     * }
     */
    return (
      <div>
        <User user={user} />
        <hr />
        <List renderItem={this.renderRepo}
              loadingLabel={loadingStarred}
              {...user.stars} />
      </div>
    );
  }

  renderRepo(repo) {
    return (
      <Repo repo={repo} key={repo.fullName} />
    );
  }

  handleLoadMoreClick() {
    this.props.loadStarred(this.props.login, true);
  }
}

UserPage.propTypes = {
  login: PropTypes.string.isRequired,
  user: PropTypes.object,
};

export default query(
  ({login}) => (
    {
      [`User(${JSON.stringify(login)}) as user`]: {
        login: true,
        avatarUrl: true,
        name: true,
        stars: {
          name: true,
          fullName: true,
          description: true,
          owner: {
            login: true
          }
        }
      }
    }
  )
)(UserPage);


export default query({
  user: {
    type: 'User',
    query: props => json`User(${props.login})`,
    fields: {
      login: true,
      avatarUrl: true,
      name: true,
      stars: {
        name: true,
        fullName: true,
        description: true,
        owner: {
          login: true
        }
      }
    }
  }
})(UserPage);


export default query({
  user: q`
    User from User(props.login) {
      ${User}.user
      stars {
        fullName
        ${Repo}.repo
      }
    }
  `
})(UserPage);
