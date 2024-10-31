import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";


test.describe("API Challenge Progress", () => {
    let URL = "https://apichallenges.herokuapp.com";
    let token;
    let ids = [];
    let id;
    let invalid_id = faker.number.int({ min: 100, max: 200 });
    let ids_to_delete = [];
    let challengerData ;
    let database = [];
    let x_auth_token;
    let note = {
        "note": "custom note"
    };
    let xmlTodo =
        `<todo>
            <title>${faker.string.alpha(50)}</title>
            <doneStatus>true</doneStatus>
            <description>${faker.string.alpha(200)}</description>
        </todo>`;
    let todo = {
        title: faker.string.alpha(50),
        doneStatus: true,
        description: faker.string.alpha(200)
    };



    test.beforeAll(async ({ request }) => {
        // Get the challenger token
        let response = await request.post(`${URL}/challenger`);
        let headers = response.headers();
        token = headers["x-challenger"];
        console.log(token);
        expect(headers).toEqual(
            expect.objectContaining({ "x-challenger": expect.any(String) })
        );

        // Get the list of todos
        response = await request.get(`${URL}/todos`, {
            headers: {
                "x-challenger": token,
            },
        });
        let body = await response.json();
        ids = body.todos.map(todo => todo.id);
        id = ids[0];

        // Create a new todo
        response = await request.post(`${URL}/todos`, {
            headers: {
                "x-challenger": token,
                "Content-Type": "application/json",
            },
            data: todo,
        });
        expect(response.status()).toBe(201);
    });

    test.describe("First Real Challenge", () => {
        test("Получить список заданий get /challenges @API", async ({ request }) => {
            let response = await request.get(`${URL}/challenges`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body.challenges.length).toBe(59);
        });
    });

    test.describe("GET Challenges", () => {
        test("Получить список todos get /todos @API", async ({ request }) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty("todos");
            expect(body.todos).toBeInstanceOf(Array);
            expect(body.todos.length).toBe(11);
            body.todos.forEach((todo) => {
                expect(todo).toHaveProperty("id");
                expect(todo).toHaveProperty("title");
                expect(todo).toHaveProperty("doneStatus");
                expect(todo).toHaveProperty("description");
            });
        });

        test("404 статус код при отправке запроса на несуществующий ресурс get /todo @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/todo`, {
                    headers: {
                        "x-challenger": token,
                    },
                });
                let body = await response.text();
                expect(response.status()).toBe(404);
                
                expect(body).toBe("");
            });

        test("Получить данные о определенном задании get /todos/{id} @API", async ({ request }) => {
            let id = 1;
            let response = await request.get(`${URL}/todos/${id}`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty("todos");
            expect(body.todos).toBeInstanceOf(Array);
            expect(body.todos.length).toBe(1);
            let todo = body.todos[0];
            expect(todo).toHaveProperty("id");
            expect(todo).toHaveProperty("title");
            expect(todo).toHaveProperty("doneStatus");
            expect(todo).toHaveProperty("description");
        });

        test("404 статус код при получении данных о несуществующем задании get /todos/{id} @API", async ({ request }) => {
            let response = await request.get(`${URL}/todos/${invalid_id}`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            expect(response.status()).toBe(404);
            expect(body).toHaveProperty("errorMessages");
            expect(body.errorMessages).toBeInstanceOf(Array);
            expect(body.errorMessages[0]).toBe(`Could not find an instance with todos/${invalid_id}`);
        });

        test("Получить список только тех заданий, которые выполнены get /todos?doneStatus=true @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    params: {
                        doneStatus: true
                    }
                });
                let body = await response.json();
                expect(response.status()).toBe(200);

                expect(body).toHaveProperty("todos");
                expect(body.todos).toBeInstanceOf(Array);
                body.todos.forEach((todo) => {
                    expect(todo).toHaveProperty("id");
                    expect(todo).toHaveProperty("title");
                    expect(todo).toHaveProperty("doneStatus", true);
                    expect(todo).toHaveProperty("description");
                });
            });

    });

    test.describe("HEAD Challenges", () => {
        test("Получить заголовки HEAD /todos @API", async ({ request }) => {
            let response = await request.head(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(200);
            
            expect(body).toBe("");
        });
    });

    test.describe("Creation Challenges with POST", () => {

        test("Создать новое задание POST /todos @API", async ({ request }) => {
            let response = await request.post(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                    "Content-Type": "application/json",
                },
                data: todo,
            });
            let body = await response.json();
            expect(response.status()).toBe(201);
            expect(body).toHaveProperty("id");
            expect(body).toHaveProperty("title", todo.title);
            expect(body).toHaveProperty("doneStatus", todo.doneStatus);
            expect(body).toHaveProperty("description", todo.description);
        });

        test("400 статус код при создании задания без корректных данных doneStatus POST /todos @API",
            async ({ request }) => {
                let modifiedTodo = {
                    title: "Новый тайтл задания",
                    doneStatus: "true",
                    description: "Новое описание задания"

                };
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await response.json();
                expect(response.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0])
                    .toBe("Failed Validation: doneStatus should be BOOLEAN but was STRING");
            });

        test("400 статус код при создании задания при указании слишком длинного тайтла(больше 50 символов) POST /todos @API",
            async ({ request }) => {
                let modifiedTodo = {
                    ...todo,
                    title: todo.title.repeat(2)
                };
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await response.json();
                expect(response.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).
                toBe("Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50");
            });

        test("400 статус код при создании задания при указании слишком длинного описания(больше 200 символов) POST /todos @API",
            async ({ request }) => {
                let modifiedTodo = {
                    ...todo,
                    description: todo.description.repeat(2)
                };
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await response.json();
                expect(response.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).
                toBe("Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200");
            });
        test("Создать новое задание с максимальной длинной title и description POST /todos @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: todo,
                });
                let body = await response.json();
                let headers = response.headers();
                expect(response.status()).toBe(201);
                expect(headers).toEqual(expect.objectContaining({"x-challenger": token}));
                expect(body).toHaveProperty("id");
                expect(body).toHaveProperty("title", todo.title);
                expect(body).toHaveProperty("doneStatus", todo.doneStatus);
                expect(body).toHaveProperty("description", todo.description);
            });

        test("413 статус код при создании задания с слишком большим description(больше 5000 символов) POST /todos @API",
            async ({ request }) => {
                let modifiedTodo = {
                    ...todo,
                    description: todo.description.repeat(26)
                };
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await response.json();
                expect(response.status()).toBe(413);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).
                toBe("Error: Request body too large, max allowed is 5000 bytes");
            });

        test("400 статус код при создании задания c дополнительным полем которого нет в схеме POST /todos @API",
            async ({ request }) => {
                let modifiedTodo = {
                    ...todo,
                    extraField: "Extra"
                };
                const extraFieldKey = Object.keys(modifiedTodo).find(key => key === 'extraField');

                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await response.json();
                expect(response.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe(`Could not find field: ${extraFieldKey}`);
            });
    });

    test.describe("Creation Challenges with PUT", () => {
        test("400 статус код при создании задания с несуществуещим id PUT /todos/{id} @API",
            async ({ request }) => {
            let response = await request.put(`${URL}/todos/${invalid_id}`, {
                headers: {
                    "x-challenger": token,
                },
                data: todo,
            });
            let body = await response.json();
            expect(response.status()).toBe(400);
            expect(body).toHaveProperty("errorMessages");
            expect(body.errorMessages).toBeInstanceOf(Array);
            expect(body.errorMessages[0]).toBe("Cannot create todo with PUT due to Auto fields id");
        });
    });

    test.describe("Update Challenges with POST", () => {
        test("Обновить данные задания POST /todos/{id} @API", async ({ request }) => {
            let modifiedTodo = {
                title: faker.string.alpha(50),
                description: faker.string.alpha(200)
            };

            let responseGet = await request.get(`${URL}/todos/${id}`, {
                headers: {
                    "x-challenger": token,
                },
            });

            let initialData = await responseGet.json();

            let responsePost = await request.post(`${URL}/todos/${id}`, {
                headers: {
                    "x-challenger": token,
                },
                data: modifiedTodo,
            });
            let updatedData = await responsePost.json();
            expect(responsePost.status()).toBe(200);
            
            expect(updatedData).toHaveProperty("id");
            expect(updatedData).toHaveProperty("title", modifiedTodo.title);
            expect(updatedData).toHaveProperty("doneStatus");
            expect(updatedData).toHaveProperty("description", modifiedTodo.description);

            expect(updatedData.title).not.toBe(initialData.todos[0].title);
            expect(updatedData.description).not.toBe(initialData.todos[0].description);
        });

        test("404 статус код при обновлении задания с несуществующим id POST /todos/{id} @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/todos/${invalid_id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: todo,
                });
                let body = await response.json();
                expect(response.status()).toBe(404);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe(`No such todo entity instance with id == ${invalid_id} found`);
            });
    });

    test.describe("Update Challenges with PUT", () => {
        test("Обновить данные задания полностью PUT /todos/{id} @API",
            async ({request}) => {
                let modifiedTodo = {
                    title: faker.string.alpha(50),
                    doneStatus: true,
                    description: faker.string.alpha(200)
                };

                let responseGet = await request.get(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                });

                let initialData = await responseGet.json();

                let responsePut = await request.put(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let updatedData = await responsePut.json();
                expect(responsePut.status()).toBe(200);
                expect(updatedData).toHaveProperty("id");
                expect(updatedData).toHaveProperty("title", modifiedTodo.title);
                expect(updatedData).toHaveProperty("doneStatus", modifiedTodo.doneStatus);
                expect(updatedData).toHaveProperty("description", modifiedTodo.description);

                expect(updatedData.title).not.toBe(initialData.todos[0].title);
                expect(updatedData.description).not.toBe(initialData.todos[0].description);
                expect(updatedData.doneStatus).not.toBe(initialData.todos[0].doneStatus);
            });

        test("Обновить данные задания частично(только title) PUT /todos/{id} @API",
            async ({request}) => {
                let modifiedTodo = {
                    title: faker.string.alpha(50)
                };

                let responseGet = await request.get(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                });

                let initialData = await responseGet.json();

                let responsePut = await request.put(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let updatedData = await responsePut.json();
                expect(responsePut.status()).toBe(200);
                expect(updatedData).toHaveProperty("id");
                expect(updatedData).toHaveProperty("title", modifiedTodo.title);
                expect(updatedData.title).not.toBe(initialData.todos[0].title);
            });

        test("400 статус код при обновлении задания с не указанием обязательного поля title PUT /todos/{id} @API",
            async ({request}) => {
                const modifiedTodo = {
                    doneStatus: true,
                    description: faker.string.alpha(200)
                };

                let responsePut = await request.put(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await responsePut.json();
                expect(responsePut.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe("title : field is mandatory");
            });

        test("400 статус код при обновлении разного id задания в url и в теле запроса PUT /todos/{id} @API",
            async ({request}) => {
                let modifiedTodo = {
                    ...todo,
                    id: id + 1
                };

                let responsePut = await request.put(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                    data: modifiedTodo,
                });
                let body = await responsePut.json();
                expect(responsePut.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe(`Can not amend id from ${id} to ${modifiedTodo.id}`);
            });
    });

    test.describe("DELETE Challenges", () => {
        test("Удалить задание DELETE /todos/{id} @API",
            async ({request}) => {
            let response = await request.delete(`${URL}/todos/${id}`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(200);
            expect(body).toBe("");
        });
    });

    test.describe("OPTIONS Challenges", () => {
        test("Получить доступные методы OPTIONS /todos @API",
            async ({request}) => {
            let response = await request.fetch(`${URL}/todos`, {
                method: "OPTIONS",
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(200);
            expect(body).toBe("");
        });
    });

    test.describe("Accept Challenges", () => {
        test("Получить данные в формате XML GET /todos @API",
            async ({request}) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                    "Accept": "application/xml",
                },
            });
            let body = await response.text();
            let headers = response.headers();
            expect(response.status()).toBe(200);
            expect(body).toContain("<todos>");
            expect(headers).toHaveProperty("content-type", "application/xml");
        });

        test(" Получить данные в формате JSON GET /todos @API",
            async ({request}) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                    "Accept": "application/json",
                },
            });
            let body = await response.json();
            let headers = response.headers();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty("todos");
            expect(body.todos).toBeInstanceOf(Array);
            expect(headers).toHaveProperty("content-type", "application/json");
        });

        test("Получить данные в формате JSON по умолчанию при указаниеи Accept */* GET /todos @API",
            async ({request}) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                    "Accept": "*/*",
                },
            });
            let body = await response.json();
            let headers = response.headers();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty("todos");
            expect(body.todos).toBeInstanceOf(Array);
            expect(headers).toHaveProperty("content-type", "application/json");
        });

        test("Получить данные в формате XML при указании Accept application/xml, application/json GET /todos @API",
            async ({request}) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                    "Accept": "application/xml, application/json",
                },
            });
            let body = await response.text();
            let headers = response.headers();
            expect(response.status()).toBe(200);
            expect(body).toContain("<todos>");
            expect(headers).toHaveProperty("content-type", "application/xml");
        });

        test("Получить данные в формате JSON по умолчанию при не указании Accept GET /todos @API",
            async ({request}) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                    "Accept": "",
                },
            });
            let body = await response.json();
            let headers = response.headers();
            expect(response.status()).toBe(200);
            expect(body).toHaveProperty("todos");
            expect(body.todos).toBeInstanceOf(Array);
            expect(headers).toHaveProperty("content-type", "application/json");
        });

        test("406 статус код при указании несуществующего Accept application/gzip GET /todos @API",
            async ({request}) => {
                let response = await request.get(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                        "Accept": "application/gzip",
                    },
                });
                let body = await response.json();
                let headers = response.headers();
                expect(response.status()).toBe(406);
                expect(headers).toHaveProperty("content-type", "application/json");
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe("Unrecognised Accept Type");
            });
    });

    test.describe("Content-Type Challenges", () => {
        test("Создать новое задание с Content-Type application/xml POST /todos @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                        "Accept": "application/xml",
                        "Content-Type": "application/xml"
                    },
                    data: xmlTodo,
                });
                let body = await response.text();
                let headers = response.headers();
                expect(response.status()).toBe(201);
                expect(headers).toHaveProperty("content-type", "application/xml");
                expect(body).toContain("<todo>");
                expect(body).toContain("<id>");
                expect(body).toContain("<title>", xmlTodo.title);
                expect(body).toContain("<doneStatus>", xmlTodo.doneStatus);
                expect(body).toContain("<description>", xmlTodo.description);
            });

        test("Создать новое задание с Content-Type application/json POST /todos @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    data: todo,
                });
                let body = await response.json();
                let headers = response.headers();
                expect(response.status()).toBe(201);
                expect(headers).toHaveProperty("content-type", "application/json");
                expect(body).toHaveProperty("id");
                expect(body).toHaveProperty("title", todo.title);
                expect(body).toHaveProperty("doneStatus", todo.doneStatus);
                expect(body).toHaveProperty("description", todo.description);
            });

        test("415 статус код при создании нового задания с Content-Type не поддерживаемым сервером POST /todos @API",
            async ({ request }) => {
                let fakeContentType = faker.string.alpha(10).toLowerCase()
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                        "Content-Type": fakeContentType
                    }
                });
                let body = await response.json();
                expect(response.status()).toBe(415);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe(`Unsupported Content Type - ${fakeContentType}`);
            });
    });

    test.describe("Fancy a Break? Restore your session", () => {
        test("Получить данные о заданиях GET /challenger/guid @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/challenger/${token}`, {
                    headers: {
                        "x-challenger": token,
                    },
                });
                challengerData = await response.json();
                expect(response.status()).toBe(200);
                expect(challengerData).toHaveProperty("xChallenger", token);
                expect(challengerData).toHaveProperty("xAuthToken");
                expect(challengerData).toHaveProperty("secretNote");
                expect(challengerData).toHaveProperty("challengeStatus");
        });

        test("Восстановить данные о заданиях PUT /challenger/guid RESTORE @API",
            async ({ request }) => {
                let response = await request.put(`${URL}/challenger/${token}`, {
                    headers: {
                        "x-challenger": token,
                        "Content-Type": "application/json"
                    },
                    data: challengerData
                });
                let body = await response.json();
                expect(response.status()).toBe(200);
                expect(body).toHaveProperty("xChallenger", token);
                expect(body).toHaveProperty("xAuthToken");
                expect(body).toHaveProperty("secretNote");
                expect(body).toHaveProperty("challengeStatus");
            });

        test("Создать данные о заданиях PUT /challenger/guid CREATE @API",
            async ({ request }) => {
                let newChallengerData = { ...challengerData };
                if (newChallengerData.challengeStatus.PUT_NEW_RESTORED_CHALLENGER_PROGRESS_STATUS === false) {
                    newChallengerData.challengeStatus.PUT_NEW_RESTORED_CHALLENGER_PROGRESS_STATUS = true;
                }

                let response = await request.put(`${URL}/challenger/${token}`, {
                    headers: {
                        "x-challenger": token,
                        "Content-Type": "application/json"
                    },
                    data: newChallengerData
                });
                let body = await response.json();
                expect(response.status()).toBe(200);
                expect(body).toHaveProperty("xChallenger", token);
                expect(body).toHaveProperty("xAuthToken");
                expect(body).toHaveProperty("secretNote");
                expect(body).toHaveProperty("challengeStatus");
            });

        test("Получить базу данных о заданиях GET /challenger/database/guid @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/challenger/database/${token}`, {
                    headers: {
                        "x-challenger": token,
                    },
                });
                database = await response.json();
                expect(response.status()).toBe(200);
                expect(database.todos).toBeInstanceOf(Array);
                database.todos.forEach((todo) => {
                    expect(todo).toHaveProperty("id");
                    expect(todo).toHaveProperty("title");
                });
            });

        test("Восстановить базу данных о заданиях PUT /challenger/database/guid @API",
            async ({ request }) => {
                let response = await request.put(`${URL}/challenger/database/${token}`, {
                    headers: {
                        "x-challenger": token,
                        "Content-Type": "application/json"
                    },
                    data: database
                });
                let body = await response.text();
                expect(response.status()).toBe(204);
                expect(body).toBe("");
            });

    });

    test.describe("Mix Accept and Content-Type Challenges", () => {
        test("Получить данные в формате JSON с Content-Type application/xml POST /todos @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                        "Accept": "application/json",
                        "Content-Type": "application/xml"
                    },
                    data: xmlTodo,
                });
                let body = await response.json();
                let headers = response.headers();
                expect(response.status()).toBe(201);
                expect(headers).toHaveProperty("content-type", "application/json");
                expect(body).toHaveProperty("id");
                expect(body).toHaveProperty("title");
                expect(body).toHaveProperty("doneStatus");
                expect(body).toHaveProperty("description");
            });

        test("Получить данные в формате XML с Content-Type application/json GET /todos @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token,
                        "Accept": "application/xml",
                        "Content-Type": "application/json"
                    },
                    data: todo,
                });
                let body = await response.text();
                let headers = response.headers();
                expect(response.status()).toBe(201);
                expect(headers).toHaveProperty("content-type", "application/xml");
                expect(body).toContain("<todo>");
                expect(body).toContain("<id>");
                expect(body).toContain("<title>", todo.title);
                expect(body).toContain("<doneStatus>", todo.doneStatus);
                expect(body).toContain("<description>", todo.description);
            });
    });

    test.describe("Status Code Challenges", () => {
        test("Запрос с неверным методом запроса на DELETE /heartbeat @API",
            async ({request}) => {
            let response = await request.delete(`${URL}/heartbeat`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(405);
            expect(body).toBe("");
        });

        test("Запрос с неверным методом запроса на PATCH /heartbeat @API",
            async ({request}) => {
            let response = await request.patch(`${URL}/heartbeat`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(500);
            expect(body).toBe("");
        });

        test("Запрос с неверным методом запроса на TRACE /heartbeat @API",
            async ({request}) => {
            let response = await request.fetch(`${URL}/heartbeat`, {
                method: "TRACE",
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(501);
            expect(body).toBe("");
        });

        test("Запрос на GET /heartbeat @API",
            async ({request}) => {
            let response = await request.get(`${URL}/heartbeat`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(204);
            expect(body).toBe("");
        });
    });

    test.describe("HTTP Method Override Challenges", () => {
        test("Переопределить метод запроса на DELETE с помощью заголовка X-HTTP-Method-Override POST /heartbeat @API",
            async ({request}) => {
            let response = await request.post(`${URL}/heartbeat`, {
                headers: {
                    "x-challenger": token,
                    "X-HTTP-Method-Override": "DELETE"
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(405);
            expect(body).toBe("");
        });

        test("Переопределить метод запроса на PATCH с помощью заголовка X-HTTP-Method-Override POST /heartbeat @API",
            async ({request}) => {
            let response = await request.post(`${URL}/heartbeat`, {
                headers: {
                    "x-challenger": token,
                    "X-HTTP-Method-Override": "PATCH"
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(500);
            expect(body).toBe("");
        });

        test("Переопределить метод запроса на Trace с помощью заголовка X-HTTP-Method-Override POST /heartbeat @API",
            async ({request}) => {
            let response = await request.post(`${URL}/heartbeat`, {
                headers: {
                    "x-challenger": token,
                    "X-HTTP-Method-Override": "TRACE"
                },
            });
            let body = await response.text();
            expect(response.status()).toBe(501);
            expect(body).toBe("");
        });

    });

    test.describe("Authentication Challenges", () => {
        test("С невернымы данными для получения токена  POST /secret/token @API",
            async ({ request }) => {
                let wrong_authorization_token = Buffer.from("admin:admin").toString("base64");
                let response = await request.post(`${URL}/secret/token`, {
                    headers: {
                        "x-challenger": token,
                        "Authorization": `Basic ${wrong_authorization_token}`
                    },
                });
                let body = await response.text()
                expect(response.status()).toBe(401);
                expect(body).toBe("");
            });

        test("С верными данными для получения токена  POST /secret/token @API",
            async ({ request }) => {
            let authorization_token = Buffer.from("admin:password").toString("base64");
            let response = await request.post(`${URL}/secret/token`, {
                headers: {
                    "x-challenger": token,
                    "Authorization": `Basic ${authorization_token}`
                }
            });
            let body = await response.text()
            let headers = response.headers();
            expect(response.status()).toBe(201);
            expect(headers).toHaveProperty("x-auth-token");
            x_auth_token = headers["x-auth-token"];
            expect(body).toBe("");
        });
    });

    test.describe("Authorization Challenges", () => {
        test("С неверным токеном X-AUTH-TOKEN для получения данных GET /secret/note @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                        "X-AUTH-TOKEN": "wrong_token"
                    },
                });
                let body = await response.text()
                expect(response.status()).toBe(403);
                expect(body).toBe("");
            });

        test("Без хедера X-AUTH-TOKEN для получения данных GET /secret/note @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                    },
                });
                let body = await response.text()
                expect(response.status()).toBe(401);
                expect(body).toBe("");
            });

        test("С верным токеном X-AUTH-TOKEN для получения данных GET /secret/note @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                        "X-AUTH-TOKEN": x_auth_token
                    },
                });
                let body = await response.json();
                expect(response.status()).toBe(200);
                expect(body).toEqual({ note: "" });
            });

        test("С токеном X-AUTH-TOKEN и payload для получения данных POST /secret/note @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                        "X-AUTH-TOKEN": x_auth_token
                    },
                    data: note
                });
                let body = await response.json();
                expect(response.status()).toBe(200);
                expect(body).toEqual({ note: "custom note" });
            });

        test("Без токена X-AUTH-TOKEN, но с payload для получения данных POST /secret/note @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token
                    },
                    data: note
                });
                let body = await response.text();
                expect(response.status()).toBe(401);
                expect(body).toBe("");
            });

        test("Неверный токен X-AUTH-TOKEN и payload для получения данных POST /secret/note @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                        "X-AUTH-TOKEN": "wrong_token"
                    },
                    data: note
                });
                let body = await response.text();
                expect(response.status()).toBe(403);
                expect(body).toBe("");
            });

        test("Токен X-AUTH-TOKEN как Authorization Bearer и payload для получения данных GET /secret/note @API",
            async ({ request }) => {
                let response = await request.get(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                        "Authorization": `Bearer ${x_auth_token}`
                    },
                });
                let body = await response.json();
                expect(response.status()).toBe(200);
                expect(body).toEqual({ note: "custom note" });
            });

        test("Токен X-AUTH-TOKEN как Authorization Bearer и как обычный хедер для получения данных с payload POST /secret/note @API",
            async ({ request }) => {
                let response = await request.post(`${URL}/secret/note`, {
                    headers: {
                        "x-challenger": token,
                        "X-AUTH-TOKEN": x_auth_token,
                        "Authorization": `Bearer ${x_auth_token}`
                    },
                    data: note
                });
                let body = await response.json();
                expect(response.status()).toBe(200);
                expect(body).toEqual({ note: "custom note" });
            });

    });

    test.describe("Miscellaneous Challenges", () => {
        test("Удаление всех заданий DELETE /todos/{id} all @API",
            async ({request}) => {
            let response = await request.get(`${URL}/todos`, {
                headers: {
                    "x-challenger": token,
                },
            });
            let body = await response.json();
            ids_to_delete = body.todos.map(todo => todo.id);
            for (let id of ids_to_delete) {
                let response = await request.delete(`${URL}/todos/${id}`, {
                    headers: {
                        "x-challenger": token,
                    },
                });
                let body = await response.text();
                expect(response.status()).toBe(200);
                expect(body).toBe("");
            }
        });

        test("Отправка максимального количества запросов POST /todos all @API",
            async ({request}) => {
                let responseTodos = await request.get(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token
                    },
                });

                let idNumber = (await responseTodos.json())['todos']
                let count = 20 - idNumber.length;
                for (let index = 0; index < count; index++) {
                    let response = await request.post(`${URL}/todos`, {
                        headers: {
                            "x-challenger": token
                        },
                        data: todo,
                    });
                    let body = await response.json();
                    expect(response.status()).toBe(201);
                    expect(body).toHaveProperty("id");
                    expect(body).toHaveProperty("title", todo.title);
                    expect(body).toHaveProperty("doneStatus", todo.doneStatus);
                    expect(body).toHaveProperty("description", todo.description);
                }

                let response = await request.post(`${URL}/todos`, {
                    headers: {
                        "x-challenger": token
                    },
                    data: todo,
                });
                let body = await response.json();
                expect(response.status()).toBe(400);
                expect(body).toHaveProperty("errorMessages");
                expect(body.errorMessages).toBeInstanceOf(Array);
                expect(body.errorMessages[0]).toBe("ERROR: Cannot add instance, maximum limit of 20 reached");
            });

    });

    test("Проверка что все задания выполнены GET /challenger/guid @API",
        async ({ request }) => {
            let response = await request.get(`${URL}/challenger/${token}`, {
                headers: {
                    "x-challenger": token,
                },
            });
            challengerData = await response.json();
            expect(response.status()).toBe(200);
            const allTrue = Object.values(challengerData.challengeStatus).every(status => status === true);
            expect(allTrue).toBe(true);
    });
});