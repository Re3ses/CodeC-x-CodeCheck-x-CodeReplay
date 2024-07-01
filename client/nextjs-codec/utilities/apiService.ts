"use server";

import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TimeToMS from "./timeToMS";
import jwt from "jsonwebtoken";
import { RegisterSchemaInferredType } from "@/lib/interface/register";
import { ClassroomShemaInferredType } from "@/lib/interface/classroom";
import { getUser } from "@/lib/auth";

const URL = process.env.SERVER_URL || "http://localhost:";
const PORT = {
    api: process.env.API_PORT || 8000,
    auth: process.env.AUTH_PORT || 8080,
    socket: process.env.SOCKET_PORT || 8800,
};

export async function setSecureCookie(name: string, value: string, expiryDate: number) {
    cookies().set({
        name: name,
        value: value,
        path: "/",
        httpOnly: true,
        sameSite: true,
        expires: expiryDate,
    });
}

export async function GetDecodedJWT() {
    try {
        const res = jwt.decode(cookies().get("refresh_token")?.value!);
        return res;
    } catch {
        throw new Error("Failed to decode jwt");
    }
}

export async function SilentLogin() {
    if (cookies().has("refresh_token")) {
        if (!cookies().has("access_token")) {
            try {
                await RefreshToken();
            } catch (e) {
                throw new Error("Failed to do silent login");
            }
        }
    } else {
        redirect("/login");
    }
}

export async function RegisterUser(payload: RegisterSchemaInferredType) {
    const url = `${URL}${PORT.api}/api/users/`;

    const alreadyExists = await axios
        .get(
            `${url}validate?username=${payload.username}&email=${payload.email}`
        )
        .then((res) => {
            return res.data;
        })
        .catch((err) => {
            console.log(err);
            throw new Error("Failed to validate username and email");
        });

    var accountCreated: any;

    // check if user already exists
    if (alreadyExists.username || alreadyExists.email) {
        if (alreadyExists.username) {
            console.log("username exists, please create a new one");
        }
        if (alreadyExists.email) {
            console.log("email bellongs to a registered user, login instead?");
        }
    } else {
        // register credentials
        await axios
            .post(`${url}register`, payload)
            .then((res) => {
                console.log(res.data);
                accountCreated = true;
            })
            .catch((err) => {
                console.log(err.data);
                accountCreated = false;
            });
    }

    return {
        usernameExists: alreadyExists.username,
        emailExists: alreadyExists.email,
        accountCreated: accountCreated,
    };
}

export async function RefreshToken() {
    let refresh_token = cookies().get("refresh_token")?.value;

    const url = `${URL}${PORT.auth}/auth/refresh/`;
    const payload = {
        token: refresh_token,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        const { access_token, refresh_token } = data;

        setSecureCookie(
            "access_token",
            access_token,
            Date.now() + TimeToMS(0, 24, 0)
        );
        setSecureCookie(
            "refresh_token",
            refresh_token,
            Date.now() + TimeToMS(12, 0, 0)
        );
    } catch (e) {
        console.error(e);
        throw new Error("Failed to refresh token: ");
    }
}

export async function ChangePass(password: string, new_password: string) {
    const user = await getUser();
    const url = `${URL}${PORT.api}/api/users/${user?.auth.username}/change-pass/`;
    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };
    const payload = {
        password: password,
        new_password: new_password,
    };

    try {
        await axios.patch(url, payload, { headers });
    } catch (e) {
        console.error(e);
    }
}

// export async function ForgotPass(new_password: string) {
//   const user = await getUser();
//   const url = `${URL}${PORT.api}/api/users/${email}/change-pass/`
//   const access_token = cookies().get("access_token")?.value
//   const headers = {
//     Authorization: `Bearer ${access_token}`
//   }
//   const payload = {
//     new_password: new_password
//   }

//   try {
//     await axios.patch(url, payload, {headers})
//   } catch (e) {
//     console.error(e)
//   }
// }

// ~~~ ROOMS ~~~
export async function CreateRoom(payload: ClassroomShemaInferredType) {
    await SilentLogin();

    const url = `${URL}${PORT.api}/api/rooms/publish/`;

    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };

    try {
        const res = await axios.post(url, payload, { headers });
        return res.data;
    } catch (e) {
        throw new Error("Failed to get create room");
    }
}

export async function GetRooms(user: string) {
    await SilentLogin();
    try {
        if (user === "Mentor") {
            // return room(s) that has same mentor id (creator) as current user (Mentor)
            const res = await GetMentorRooms();
            return res?.data;
        } else {
            // return only the classroom(s) the learner has enrolled in
            const res = await GetLearnerRooms();
            return res?.data;
        }
    } catch (e) {
        throw new Error("Failed to get rooms");
    }
}

export async function GetLearnerRooms() {
    try {
        const user = await getUser();
        const url = `${URL}${PORT.api}/api/rooms/learner/${user?.auth.username}`;
        const access_token = cookies().get("access_token")?.value;

        if (!access_token) {
            throw new Error("Missing access token");
        }

        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (!res.ok) {
            throw new Error("Failed to get learner rooms");
        }

        const rooms = await res.json();

        if (!rooms) {
            throw new Error("Rooms not found");
        }

        return rooms;
    } catch (e) {
        console.error("Error fetching learner rooms: ", e);
        throw new Error("Failed to get learner rooms");
    }
}

export async function GetMentorRooms() {
    try {
        const user = await getUser();;
        const url = `${URL}${PORT.api}/api/rooms/mentor/${user?.auth.username}`;
        const access_token = cookies().get("access_token")?.value;
        const headers = {
            Authorization: `Bearer ${access_token}`,
        };
        const res = await axios.get(url, { headers }).then((data) => { return (data) });
        return res.data;
    } catch (e) {
        return e
    }
}

export async function GetRoom(slug: string) {
    const url = `${URL}${PORT.api}/api/rooms/${slug}`;

    await SilentLogin();

    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };

    try {
        const res = await axios.get(url, { headers });
        return res.data;
    } catch (e) {
        throw new Error("Failed to get room");
    }
}
// ~~~ END ROOMS ~~~

// ~~~ PROBLEMS ~~~
// export async function CreateProblem(data: ProblemSchemaInferredType) {
export async function CreateProblem(data: any) {
    const url = `${URL}${PORT.api}/api/problems/publish`;
    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };

    try {
        const res = await axios.post(url, data, { headers });
        return res.data;
    } catch (e) {
        throw new Error("Failed to create problem");
    }
}

// Params not implimented
export async function GetProblemsMentor() {
    const user = await getUser();
    console.log(user)
    const url = `${URL}${PORT.api}/api/problems/mentor/${user.auth.username}`;
    console.log(url)
    const access_token = cookies().get("access_token")?.value;
    const options = {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    };

    try {
        const res = await axios.get(url, options);
        return res.data;
    } catch (e) {
        throw new Error(`Failed to get problems by mentor: ${user.auth.username}`);
    }
}

// | `GET`     | `/api/problems/:slug`             | `Content-Type`, `Authorization` | `None` | `None` |
export async function GetProblems(slug: string) {
    await SilentLogin();

    const url = `${URL}${PORT.api}/api/problems/${slug}`;
    const access_token = cookies().get("access_token")?.value;
    const options = {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    };

    try {
        const res = await axios.get(url, options);
        return res.data;
    } catch (e) {
        throw new Error(`Failed to get problem: ${slug}`);
    }
}

//`PATCH`   | `/api/rooms/:room_slug/post/:problem_slug`
export async function PostProblem(rooms_slug: string, problems_slug: string) {
    const url = `${URL}${PORT.api}/api/rooms/${rooms_slug}/post/${problems_slug}`;
    console.log(url);
    const access_token = cookies().get("access_token")?.value;
    const options = {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    };

    try {
        await axios.patch(url, {}, options);
    } catch (e) {
        throw new Error(
            `Failed to add problem: ${problems_slug} to room ${rooms_slug}`
        );
    }
}

// `PATCH`   | `/api/rooms/:room_slug/remove/:problem_slug`
export async function RemoveProblem(rooms_slug: string, problems_slug: string) {
    const url = `${URL}${PORT.api}/api/rooms/${rooms_slug}/remove/${problems_slug}`;
    const access_token = cookies().get("access_token")?.value;
    const options = {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    };

    try {
        await axios.patch(url, options);
    } catch (e) {
        throw new Error(
            `Failed to remove problem: ${problems_slug} from room ${rooms_slug}`
        );
    }
}
// ~~~ END PROBLEMS ~~~

// ~~~ ENROLL ~~~
export async function GetEnrollees(slug: string) {
    const url = `${URL}${PORT.api}/api/rooms/${slug}/enrollees`;

    await SilentLogin();

    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };

    try {
        const res = await axios.get(url, { headers });
        return res.data;
    } catch (e: AxiosError | any) {
        return {
            message: "No enrollees found",
        };
    }
}

export async function Enroll(slug: string) {
    const user = await getUser();;
    const url = `${URL}${PORT.api}/api/rooms/${slug}/enroll/${user.auth.username}`;

    await SilentLogin();

    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };

    try {
        const res = await axios.patch(url, {}, { headers });
        console.log(res);
        return {
            message: "Successfully joined",
        }
    } catch (e) {
        return {
            message: "Error occured",
        }
    }
}


export async function Unenroll(slug: string, username: string) {
    const url = `${URL}${PORT.api}/api/rooms/${slug}/unenroll/${username}`;

    await SilentLogin();

    const access_token = cookies().get("access_token")?.value;
    const headers = {
        Authorization: `Bearer ${access_token}`,
    };

    try {
        const res = await axios.patch(url, {}, { headers });
        console.log(res.data);
        return res.data;
    } catch (e) {
        throw new Error("Failed to get unenroll user");
    }
}
// ~~~ END ENROLL ~~~
