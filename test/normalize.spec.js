import { expect } from 'chai';
import normalize from '../dist/bundle';

describe('data is normalized', () => {
  const exampleExpiryDate = new Date();

  const json = {
    id: 3,
    text: 'hello',
    number: 3,
    social: {
      likes: 35,
    },
    _embedded: {
      author: {
        id: 42,
        name: 'Frank Zappa',
        _links: {
          self: {
            href: 'http://www.example.com/users/42',
          },
        },
      },
      attachments: [
        {
          id: 4003,
          title: 'document.pdf',
          filePath: 'http://...',
          _links: {
            self: {
              href: 'http://www.example.com/attachments/4003',
            },
            post: {
              href: 'http://www.example.com/post/3',
            },
          },
        },
      ],
    },
    _links: {
      self: {
        href: 'http://www.example.com/post/3',
      },
      approvedBy: {
        href: 'http://www.example.com/users/42',
      },
      comments: {
        href: 'http://www.example.com/comments?post=3',
      },
    },
    _meta: {
      expires: exampleExpiryDate,
    },
  };

  const output = {
    '/post/3': {
      id: 3,
      text: 'hello',
      number: 3,
      social: {
        likes: 35,
      },
      author: {
        href: '/users/42',
      },
      attachments: [
        {
          href: '/attachments/4003',
        },
      ],
      approvedBy: {
        href: '/users/42',
      },
      comments: {
        href: '/comments?post=3',
      },
      _meta: {
        expires: exampleExpiryDate,
        self: '/post/3',
      },
    },
    '/users/42': {
      id: 42,
      name: 'Frank Zappa',
      _meta: {
        self: '/users/42',
      },
    },
    '/attachments/4003': {
      id: 4003,
      title: 'document.pdf',
      filePath: 'http://...',
      post: {
        href: '/post/3',
      },
      _meta: {
        self: '/attachments/4003',
      },
    },
  };

  const API_BASE_URL = 'http://www.example.com';

  it('data attributes => map: %{id => Object}', () => {
    const result = normalize(json, { baseUrl: API_BASE_URL });

    expect(result).to.deep.equal(output);
  });

  it("data is empty shouldn't fail", () => {
    const result = normalize({}, { baseUrl: API_BASE_URL });

    expect(result).to.deep.equal({});
  });

  it('keys camelized', () => {
    const input = {
      id: 1,
      'key-is-camelized': 2,
      _meta: {
        'this-key-too': 3,
      },
      _embedded: {
        'this-embedded-as-well': {
          id: 4040,
          _links: {
            self: {
              href: 'http://embedded.com',
            },
          },
        },
      },
      _links: {
        self: {
          href: 'http://self-link.com',
        },
        this_link: {
          href: 'http://link.com',
        },
      },
    };

    const camelizedOutput = {
      'http://self-link.com': {
        id: 1,
        keyIsCamelized: 2,
        thisEmbeddedAsWell: {
          href: 'http://embedded.com',
        },
        thisLink: {
          href: 'http://link.com',
        },
        _meta: {
          self: 'http://self-link.com',
          thisKeyToo: 3,
        },
      },
      'http://embedded.com': {
        id: 4040,
        _meta: {
          self: 'http://embedded.com',
        },
      },
    };

    const result = normalize(input);

    expect(result).to.deep.equal(camelizedOutput);
  });

  it('nested keys camelized', () => {
    const input = {
      id: 1,
      key_is_camelized: 2,
      another_key: {
        and_yet_another: 3,
      },
      _links: {
        self: {
          href: 'http://test-camel-case.com',
        },
      },
    };

    const camelizedOutput = {
      'http://test-camel-case.com': {
        id: 1,
        keyIsCamelized: 2,
        anotherKey: {
          andYetAnother: 3,
        },
        _meta: {
          self: 'http://test-camel-case.com',
        },
      },
    };

    const result = normalize(input);

    expect(result).to.deep.equal(camelizedOutput);
  });

  it('arrays are still array after camelization', () => {
    const input = {
      id: 1,
      key_is_camelized: ['a', 'b'],
      _links: {
        self: {
          href: 'http://www.example.com/entity/1',
        },
      },
    };

    const camelizedOutput = {
      'http://www.example.com/entity/1': {
        id: 1,
        keyIsCamelized: ['a', 'b'],
        _meta: {
          self: 'http://www.example.com/entity/1',
        },
      },
    };

    const result = normalize(input);

    expect(result).to.deep.equal(camelizedOutput);
  });

  it('dates should not be affected by camelization', () => {
    const date = new Date();

    const obj = {
      id: 1,
      'started-at': date,
      _links: {
        self: {
          href: 'http://www.example.com/entity/1',
        },
      },
    };

    const camelizedOutput = {
      'http://www.example.com/entity/1': {
        id: 1,
        startedAt: date,
        _meta: {
          self: 'http://www.example.com/entity/1',
        },
      },
    };

    const result = normalize(obj);

    expect(result).to.deep.equal(camelizedOutput);
  });
});

describe('_embedded is normalized', () => {
  const json = {
    id: 3,
    name: 'Father',
    _embedded: {
      firstBornSon: {
        id: 40,
        name: 'Son',
        _links: {
          self: {
            href: 'http://example.com/users/40',
          },
        },
      },
    },
    _links: {
      self: {
        href: 'http://example.com/users/3',
      },
    },
  };

  const output = {
    'http://example.com/users/3': {
      id: 3,
      name: 'Father',
      firstBornSon: {
        href: 'http://example.com/users/40',
      },
      _meta: {
        self: 'http://example.com/users/3',
      },
    },
    'http://example.com/users/40': {
      id: 40,
      name: 'Son',
      _meta: {
        self: 'http://example.com/users/40',
      },
    },
  };

  it('included => map: %{id => Object}', () => {
    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });
});

describe('embedded', () => {
  it('embedded null', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _embedded: {
        question: null,
      },
      _links: {
        self: {
          href: 'http://example.com/entity/1',
        },
      },
    };

    const output = {
      'http://example.com/entity/1': {
        id: 2620,
        text: 'hello',
        question: null,
        _meta: {
          self: 'http://example.com/entity/1',
        },
      },
    };

    const result = normalize(json);

    expect(result)
      .to
      .deep
      .equal(output);
  });

  it('empty embedded list', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _embedded: {
        tags: [],
      },
      _links: {
        self: {
          href: 'http://example.com/entity/1',
        },
      },
    };

    const output = {
      'http://example.com/entity/1': {
        id: 2620,
        text: 'hello',
        tags: [],
        _meta: {
          self: 'http://example.com/entity/1',
        },
      },
    };

    const result = normalize(json);

    expect(result)
      .to
      .deep
      .equal(output);
  });

  it('non-empty embedded', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _embedded: {
        question: {
          id: 7,
          type: 'question',
          _links: {
            self: {
              href: 'http://example.com/questions/7',
            },
          },
        },
      },
      _links: {
        self: {
          href: 'http://example.com/posts/2620',
        },
      },
    };

    const output = {
      'http://example.com/posts/2620': {
        id: 2620,
        text: 'hello',
        question: {
          href: 'http://example.com/questions/7',
        },
        _meta: {
          self: 'http://example.com/posts/2620',
        },
      },
      'http://example.com/questions/7': {
        id: 7,
        _meta: {
          self: 'http://example.com/questions/7',
        },
      },
    };

    const result = normalize(json);

    expect(result)
      .to
      .deep
      .equal(output);
  });

  it('non-empty embedded list', () => {
    const json = {
      id: 257,
      _embedded: {
        comments: [
          {
            id: 123,
            content: 'great post',
            _links: {
              self: {
                href: 'http://example.com/comments/123',
              },
            },
          },
          {
            id: 124,
            content: 'thanks',
            _links: {
              self: {
                href: 'http://example.com/comments/124',
              },
            },
          },
        ],
      },
      _links: {
        self: {
          href: 'http://example.com/posts/257',
        },
      },
    };

    const output = {
      'http://example.com/posts/257': {
        id: 257,
        comments: [
          {
            href: 'http://example.com/comments/123',
          },
          {
            href: 'http://example.com/comments/124',
          },
        ],
        _meta: {
          self: 'http://example.com/posts/257',
        },
      },
      'http://example.com/comments/123': {
        id: 123,
        content: 'great post',
        _meta: {
          self: 'http://example.com/comments/123',
        },
      },
      'http://example.com/comments/124': {
        id: 124,
        content: 'thanks',
        _meta: {
          self: 'http://example.com/comments/124',
        },
      },
    };

    const result = normalize(json);

    expect(result)
      .to
      .deep
      .equal(output);
  });

  it('keys of embedded are camelized', () => {
    const json = {
      id: 2620,
      _embedded: {
        'rel1-to-camelize': {
          id: 4,
          _links: {
            self: {
              href: 'test.com',
            },
          },
        },
        'rel2-to-camelize': [],
        'rel3-to-camelize': null,
      },
      _links: {
        self: {
          href: 'test.com/entities/2620',
        },
      },
    };

    const output = {
      'test.com/entities/2620': {
        id: 2620,
        rel1ToCamelize: {
          href: 'test.com',
        },
        rel2ToCamelize: [],
        rel3ToCamelize: null,
        _meta: {
          self: 'test.com/entities/2620',
        },
      },
      'test.com': {
        id: 4,
        _meta: {
          self: 'test.com',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('embedded meta', () => {
    const json1 = {
      id: '2620',
      text: 'hello',
      _embedded: {
        questions: [
          {
            id: 295,
            text: 'Why?',
            _meta: {
              expires_at: 1513868982,
            },
            _links: {
              self: {
                href: 'http://example.com/posts/2620/questions',
              },
            },
          },
        ],
      },
      _links: {
        self: {
          href: 'http://example.com/posts/2620',
        },
      },
    };

    const output1 = {
      'http://example.com/posts/2620': {
        id: '2620',
        text: 'hello',
        questions: [
          {
            href: 'http://example.com/posts/2620/questions',
          },
        ],
        _meta: {
          self: 'http://example.com/posts/2620',
        },
      },
      'http://example.com/posts/2620/questions': {
        id: 295,
        text: 'Why?',
        _meta: {
          self: 'http://example.com/posts/2620/questions',
          expires_at: 1513868982,
        },
      },
    };
    const result = normalize(json1);

    expect(result).to.deep.equal(output1);
  });
});

describe('links', () => {
  it('null link', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _links: {
        self: {
          href: 'http://example.com/api/v1/post/2620',
        },
        author: null,
      },
    };

    const output = {
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        author: null,
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('keep links', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _links: {
        self: {
          href: 'http://example.com/api/v1/post/2620',
        },
        author: {
          href: 'http://example.com/api/v1/post/2620/author',
        },
      },
    };

    const output = {
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        author: {
          href: 'http://example.com/api/v1/post/2620/author',
        },
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('empty link array', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _links: {
        self: {
          href: 'http://example.com/api/v1/post/2620',
        },
        comments: [],
      },
    };

    const output = {
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        comments: [],
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('link array with one element', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _links: {
        self: {
          href: 'http://example.com/api/v1/post/2620',
        },
        comments: [
          {
            href: 'http://example.com/api/v1/post/2620/comments/3450',
          },
        ],
      },
    };

    const output = {
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        comments: [
          {
            href: 'http://example.com/api/v1/post/2620/comments/3450',
          },
        ],
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('link array with multiple elements', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _links: {
        self: {
          href: 'http://example.com/api/v1/post/2620',
        },
        comments: [
          {
            href: 'http://example.com/api/v1/post/2620/comments/3450',
          },
          {
            href: 'http://example.com/api/v1/post/2620/comments/3451',
          },
        ],
      },
    };

    const output = {
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        comments: [
          {
            href: 'http://example.com/api/v1/post/2620/comments/3450',
          },
          {
            href: 'http://example.com/api/v1/post/2620/comments/3451',
          },
        ],
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('link in embedded', () => {
    const json = {
      id: 2,
      username: 'Paul',
      _embedded: {
        latestPost: {
          id: 2620,
          text: 'hello',
          _links: {
            self: {
              href: 'http://example.com/api/v1/post/2620',
            },
            author: 'http://example.com/api/v1/user/2',
            comments: [
              {
                href: 'http://example.com/api/v1/post/2620/comments/3450',
              },
              {
                href: 'http://example.com/api/v1/post/2620/comments/3451',
              },
            ],
          },
        },
      },
      _links: {
        self: {
          href: 'http://example.com/api/v1/user/2',
        },
      },
    };

    const output = {
      'http://example.com/api/v1/user/2': {
        id: 2,
        username: 'Paul',
        latestPost: {
          href: 'http://example.com/api/v1/post/2620',
        },
        _meta: {
          self: 'http://example.com/api/v1/user/2',
        },
      },
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        comments: [
          {
            href: 'http://example.com/api/v1/post/2620/comments/3450',
          },
          {
            href: 'http://example.com/api/v1/post/2620/comments/3451',
          },
        ],
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('camelize links', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _embedded: {
        tags: [
          {
            id: 4,
            _links: {
              self: {
                href: 'http://example.com/api/v1/post/2620/tags',
              },
              camel_case: {
                href: 'http://example.com/api/v1/post/2620/camel_case',
              },
            },
          },
        ],
      },
      _links: {
        self: {
          href: 'http://example.com/api/v1/post/2620',
        },
        'camel-case': {
          href: 'http://example.com/api/v1/post/2620/camel-case',
        },
      },
    };

    const output = {
      'http://example.com/api/v1/post/2620': {
        id: 2620,
        text: 'hello',
        tags: [
          {
            href: 'http://example.com/api/v1/post/2620/tags',
          },
        ],
        camelCase: {
          href: 'http://example.com/api/v1/post/2620/camel-case',
        },
        _meta: {
          self: 'http://example.com/api/v1/post/2620',
        },
      },
      'http://example.com/api/v1/post/2620/tags': {
        id: 4,
        camelCase: {
          href: 'http://example.com/api/v1/post/2620/camel_case',
        },
        _meta: {
          self: 'http://example.com/api/v1/post/2620/tags',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });
});

describe('references (resources with nothing but a self link)', () => {
  it('normalizes references', () => {
    const json = {
      id: 2620,
      text: 'hello',
      _embedded: {
        question: {
          _links: {
            self: {
              href: 'http://example.com/question/1234',
            },
          },
        },
      },
      _links: {
        self: {
          href: 'http://example.com/entity/1',
        },
      },
    };

    const output = {
      'http://example.com/entity/1': {
        id: 2620,
        text: 'hello',
        question: {
          href: 'http://example.com/question/1234',
        },
        _meta: {
          self: 'http://example.com/entity/1',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });

  it('handles top-level reference gracefully', () => {
    const json = {
      _links: {
        self: {
          href: 'http://example.com/entity/1',
        },
      },
    };

    // TODO is this really the most logical output?
    const output = {};

    const result = normalize(json);

    expect(result).to.deep.equal(output);
  });
});

describe('complex', () => {
  const json = {
    id: 29,
    text: 'Perche il mare?',
    slug: 'tbd',
    _meta: {
      expires_at: 1513868982,
    },
    _embedded: {
      author: {
        id: 1,
        slug: 'superyuri',
        _links: {
          self: 'http://example.com/users/1',
        },
      },
      likedBy: [],
      answeredBy: [
        {
          id: 1,
          slug: 'superyuri',
          _links: {
            self: 'http://example.com/users/1',
          },
        },
      ],
    },
    _links: {
      self: {
        href: 'http://example.com/questions/29',
      },
      'post-blocks': [
        {
          href: 'http://example.com/blocks/4601',
        },
        {
          href: 'http://example.com/blocks/2454',
        },
      ],
    },
  };

  const output = {
    'http://example.com/questions/29': {
      id: 29,
      text: 'Perche il mare?',
      slug: 'tbd',
      author: {
        href: 'http://example.com/users/1',
      },
      likedBy: [],
      answeredBy: [
        {
          href: 'http://example.com/users/1',
        },
      ],
      postBlocks: [
        {
          href: 'http://example.com/blocks/4601',
        },
        {
          href: 'http://example.com/blocks/2454',
        },
      ],
      _meta: {
        self: 'http://example.com/questions/29',
        expires_at: 1513868982,
      },
    },
    'http://example.com/users/1': {
      id: 1,
      slug: 'superyuri',
      _meta: {
        self: 'http://example.com/users/1',
      },
    },
  };

  const output2 = {
    'http://example.com/questions/29': {
      id: 29,
      text: 'Perche il mare?',
      slug: 'tbd',
      author: {
        href: 'http://example.com/users/1',
      },
      likedBy: [],
      answeredBy: [
        {
          href: 'http://example.com/users/1',
        },
      ],
      'post-blocks': [
        {
          href: 'http://example.com/blocks/4601',
        },
        {
          href: 'http://example.com/blocks/2454',
        },
      ],
      _meta: {
        self: 'http://example.com/questions/29',
        expires_at: 1513868982,
      },
    },
    'http://example.com/users/1': {
      id: 1,
      slug: 'superyuri',
      _meta: {
        self: 'http://example.com/users/1',
      },
    },
  };

  it('test data camelizeKeys: true', () => {
    const result = normalize(json, { camelizeKeys: true });

    expect(result).to.deep.eql(output);
  });

  it('test data camelizeKeys: false', () => {
    const result = normalize(json, { camelizeKeys: false });

    expect(result).to.deep.eql(output2);
  });
});

describe('base URI removal', () => {
  const json = {
    id: 2620,
    text: 'hello',
    _embedded: {
      question: {
        id: 1234,
        text: 'Hello?',
        _links: {
          self: {
            href: 'http://example.com/api/question/1234',
          },
        },
      },
    },
    _links: {
      self: {
        href: 'http://example.com/api/entity/1',
      },
    },
  };

  const output = {
    '/entity/1': {
      id: 2620,
      text: 'hello',
      question: {
        href: '/question/1234',
      },
      _meta: {
        self: '/entity/1',
      },
    },
    '/question/1234': {
      id: 1234,
      text: 'Hello?',
      _meta: {
        self: '/question/1234',
      },
    },
  };

  const output2 = {
    'http://example.com/api/entity/1': {
      id: 2620,
      text: 'hello',
      question: {
        href: 'http://example.com/api/question/1234',
      },
      _meta: {
        self: 'http://example.com/api/entity/1',
      },
    },
    'http://example.com/api/question/1234': {
      id: 1234,
      text: 'Hello?',
      _meta: {
        self: 'http://example.com/api/question/1234',
      },
    },
  };

  it('removes prefix if option is set', () => {
    const result = normalize(json, { baseUrl: 'http://example.com/api' });

    expect(result)
      .to
      .deep
      .equal(output);
  });

  it('doesn\'t remove prefix by default', () => {
    const result = normalize(json);

    expect(result)
      .to
      .deep
      .equal(output2);
  });
});

describe('URI comparison', () => {
  it('sorts query parameters in self links', () => {
    const json = {
      id: 29,
      text: 'Perche il mare?',
      _embedded: {
        author: {
          id: 1,
          slug: 'superyuri',
          _links: {
            self: 'http://example.com/users/1?abc=123&test=456',
          },
        },
      },
      _links: {
        self: {
          href: 'http://example.com/questions/29?e[]=abc&a[]=123&a=test',
        },
        activeAdmins: {
          href: 'http://example.com/users?role=Admin&active=true',
        },
      },
    };

    const output = {
      'http://example.com/questions/29a=test&a%5B%5D=123&e%5B%5D=abc': {
        id: 29,
        text: 'Perche il mare?',
        author: {
          href: 'http://example.com/users/1?abc=123&test=456',
        },
        activeAdmins: {
          href: 'http://example.com/users?active=true&role=Admin',
        },
        _meta: {
          self: 'http://example.com/questions/29a=test&a%5B%5D=123&e%5B%5D=abc',
        },
      },
      'http://example.com/users/1?abc=123&test=456': {
        id: 1,
        slug: 'superyuri',
        _meta: {
          self: 'http://example.com/users/1?abc=123&test=456',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.eql(output);
  });

  it('matches URIs with different query parameter order', () => {
    const json = {
      id: 29,
      text: 'Perche il mare?',
      _embedded: {
        author: {
          id: 1,
          slug: 'superyuri',
          _links: {
            self: 'http://example.com/users/1?abc=123&test=456',
          },
        },
        answeredBy: [
          {
            id: 1,
            slug: 'superyuri',
            _links: {
              self: 'http://example.com/users/1?test=456&abc=123',
            },
          },
        ],
      },
      _links: {
        self: {
          href: 'http://example.com/questions/29',
        },
      },
    };

    const output = {
      'http://example.com/questions/29': {
        id: 29,
        text: 'Perche il mare?',
        author: {
          href: 'http://example.com/users/1?abc=123&test=456',
        },
        answeredBy: [
          {
            href: 'http://example.com/users/1?abc=123&test=456',
          },
        ],
        _meta: {
          self: 'http://example.com/questions/29',
        },
      },
      'http://example.com/users/1?abc=123&test=456': {
        id: 1,
        slug: 'superyuri',
        _meta: {
          self: 'http://example.com/users/1?abc=123&test=456',
        },
      },
    };

    const result = normalize(json);

    expect(result).to.deep.eql(output);
  });
});
