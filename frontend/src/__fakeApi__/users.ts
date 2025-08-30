import Mock from "__fakeApi__/mock";

// Simulação simples de JWT sem biblioteca Node.js
const createFakeToken = (userId: number) => {
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
  const payload = btoa(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  return `${header}.${payload}.fake-signature`;
};

const decodeFakeToken = (token: string) => {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) throw new Error('Token expired');
    return payload;
  } catch {
    throw new Error('Invalid token');
  }
};

const userList = [
  {
    id: 1,
    role: "SA",
    name: "Jason Alexander",
    username: "jason_alexander",
    email: "demo@example.com",
    avatar: "/static/avatar/001-man.svg",
    age: 25,
    // password: 'v&)3?2]:'
  },
];

Mock.onPost("/api/auth/login").reply(async (config) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { email } = JSON.parse(config.data);
    const user = userList.find((user) => user.email === email);
    if (!user) {
      return [400, { message: "Invalid email or password" }];
    }
    const accessToken = createFakeToken(user.id);
    return [
      200,
      {
        accessToken,
        user: {
          id: user.id,
          avatar: user.avatar,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    ];
  } catch (error) {
    console.error(error);
    return [500, { message: "Internal server error" }];
  }
});

Mock.onPost("/api/auth/register").reply(async (config) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { email, username } = JSON.parse(config.data);
    const user = userList.find((user) => user.email === email);
    if (user) {
      return [400, { message: "User already exists!" }];
    }

    const newUser = {
      id: 2,
      role: "GUEST",
      name: "",
      username: username,
      email: email,
      avatar: "/static/avatar/001-man.svg",
      age: 25,
    };
    userList.push(newUser);

    const accessToken = createFakeToken(newUser.id);

    return [
      200,
      {
        accessToken,
        user: {
          id: newUser.id,
          avatar: newUser.avatar,
          email: newUser.email,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
        },
      },
    ];
  } catch (error) {
    console.error(error);
    return [500, { message: "Internal server error" }];
  }
});

Mock.onGet("/api/auth/profile").reply((config) => {
  try {
    //@ts-ignore
    const { Authorization } = config.headers;
    if (!Authorization) {
      return [401, { message: "Invalid Authorization token" }];
    }
    const accessToken = Authorization.split(" ")[1];
    const { userId }: any = decodeFakeToken(accessToken);
    const user = userList.find((u) => u.id === userId);

    if (!user) {
      return [401, { message: "Invalid authorization token" }];
    }

    return [
      200,
      {
        user: {
          id: user.id,
          avatar: user.avatar,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    ];
  } catch (err) {
    console.error(err);
    return [500, { message: "Internal server error" }];
  }
});
