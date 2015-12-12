function getPaged(client, url) {
  return client.get(url, {}).then(function (page) {
    return {
      items: page,
      nextToken: page.urlNext
    };
  });
}

const User = {
  _name: 'User',
  _id: 'login',
  login: {type: 'String'},
  name: {type: 'String'},
  avatarUrl: {type: 'String', from: 'avatar_url'},
  starred: {
    type: 'Collection',
    of: Repository,
    resolve(self, args, ctx) {
      return getPaged(ctx.client, self.starred_url);
    },
    nextPage(self, nextToken, ctx) {
      return getPaged(ctx.client, nextToken);
    }
  }
};

const Repository = {
  _name: 'Repository',
  _id: 'full_name',
  fullName: {type: 'String', from: 'full_name'},
  owner: {type: User},
  name: {type: 'String'},
  description: {type: 'String'},
  stargazers: {
    type: 'Collection',
    of: User,
    resolve(self, args, ctx) {
      return getPaged(ctx.client, self.stargazers_url);
    },
    nextPage(self, nextToken, ctx) {
      return getPaged(ctx.client, nextToken);
    }
  }
};

export const root = {
  User: {
    type: User,
    resolve(self, [login], ctx) {
      return ctx.client.get('/users/:login', {login});
    },
  },
  Repository: {
    type: Repository,
    resolve(self, [fullName], ctx) {
      return ctx.client.get('/repos/:owner/:repo', {
        owner: fullName.split('/')[0],
        repo: fullName.split('/')[1]
      });
    }
  }
};
