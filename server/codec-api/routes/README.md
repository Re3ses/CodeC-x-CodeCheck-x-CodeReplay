
# **Codec-API Routes**
> This is an in-depth guide on what are the available routes/endpoints to be used in `codec-api`.
- *Requirement prefixed by `*` is optional for every request, while if it is suffixed by `\[]` means there exists an exception.*.

## **Summary**
- [**User-related Routes:**](#user-related-routes)
- [**Coderoom-related Routes:**](#coderoom-related-routes)
- [**External-related Routes:**](#external-related-routes)

### **User-related Routes:**
1. `Auth`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `POST` | `/auth/refresh`  | `{ Content-Type }` | `{ token }` ||
        | `POST` | `/auth/login`    | `{ Content-Type }` | `{ username, password }` ||
2. `Badge`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/badges/`            | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/badges/:id`         | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/badges/type/:type`  | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/badges/upload`      | `Content-Type`, `Authorization` | `{ name, description, filename, type, condition }` ||
        | `PATCH`   | `/api/badges/:id`         | `Content-Type`, `Authorization` | `{ name, description, filename, type, condition  }` ||
        | `DELETE`  | `/api/badges/:id`         | `Content-Type`, `Authorization` | `None` ||
3. `Heart`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/hearts/`                    | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/hearts/get`                 | `Content-Type`, `Authorization` | `None` | `{ username(learner), problem_slug(problem), room_slug(room) }` |
        | `GET`     | `/api/hearts/:id`                 | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/hearts/learner/:username`   | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/hearts/problem/:slug`       | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/hearts/room/:slug`          | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/hearts/init`                | `Content-Type`, `Authorization` | `{ learner(username), problem(slug) }` ||
        | `PATCH`   | `/api/hearts/:id/depl`            | `Content-Type`, `Authorization` | `None` ||
4. `Save`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/saves/`                     | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/saves/get`                  | `Content-Type`, `Authorization` | `None` | `{ username(learner), problem_slug(problem), room_slug(room), language }` |
        | `GET`     | `/api/saves/:id`                  | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/saves/learner/:username`    | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/saves/problem/:slug`        | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/saves/room/:slug`           | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/saves/save`                 | `Content-Type`, `Authorization` | `{ language, code, learner(username), problem(slug) }` ||
        | `PATCH`   | `/api/saves/:id`                  | `Content-Type`, `Authorization` | `{ language, code }` ||
5. `Submission`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/subs/`                      | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/subs/get`                   | `Content-Type`, `Authorization` | `None` | `{ username(learner), problem_slug(problem), room_slug(room), *limit }` |
        | `GET`     | `/api/subs/:id`                   | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/subs/learner/:username`     | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/subs/learner/:username/unique`   | `Content-Type`, `Authorization` | `None` | `{ slug(room), verdict, include_language }` |
        | `GET`     | `/api/subs/problem/:slug`         | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/subs/room/:slug`            | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/subs/submit`                | `Content-Type`, `Authorization` | `{ language, code, score, verdict, time_complexity, space_complexity, learner(username), problem(slug), room(slug), heart(id) }`||
        | `PATCH`   | `/api/subs/:id/verdict`           | `Content-Type`, `Authorization` | `{ score, verdict, time_complexity, space_complexity }` ||
6. `User`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/users/`                         | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/users/types`                    | `Content-Type` | `None` | `None` |
        | `GET`     | `/api/users/validate`                 | `Content-Type` | `None` | `{ *username, *email }` |
        | `GET`     | `/api/users/:username`                | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/users/type/:type`               | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/users/register`                 | `Content-Type`, `Authorization` | `{ first_name, last_name, type, username, password, email }` ||
        | `PATCH`   | `/api/users/:username`                | `Content-Type`, `Authorization` | `{ *all \[username, email] } }` ||
        | `PATCH`   | `/api/users/:username/change-pass`    | `Content-Type`, `Authorization` | `{ password, new_password }` ||
        | `PATCH`   | `/api/users/:email/forgot-pass`       | `Content-Type`, `Authorization` | `{ new_password }` ||
---
### **Coderoom-related Routes:**
1. `Coderoom`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/rooms/`                                         | `Content-Type`, `Authorization` | `None` | `{ *is_archived, *limit }` |
        | `GET`     | `/api/rooms/types`                                    | `Content-Type` | `None` | `None` |
        | `GET`     | `/api/rooms/:slug`                                    | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/rooms/:slug/enrollees`                          | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/rooms/:slug/badges/:username`                   | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/rooms/:slug/leaderboards`                       | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/rooms/mentor/:username`                         | `Content-Type`, `Authorization` | `None` | `{ *is_archived, *limit }` |
        | `GET`     | `/api/rooms/learner/:username`                        | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/rooms/publish`                                  | `Content-Type`, `Authorization` | `{ name, *description, type, mentor(username) }` ||
        | `PATCH`   | `/api/rooms/:slug`                                    | `Content-Type`, `Authorization` | `{ *all \[slug]}` ||
        | `PATCH`   | `/api/rooms/:slug/enroll/:username`                   | `Content-Type`, `Authorization` | `None` ||
        | `PATCH`   | `/api/rooms/:slug/unenroll/:username`                 | `Content-Type`, `Authorization` | `None` ||
        | `PATCH`   | `/api/rooms/:room_slug/post/:problem_slug`            | `Content-Type`, `Authorization` | `None` ||
        | `PATCH`   | `/api/rooms/:room_slug/remove/:problem_slug`          | `Content-Type`, `Authorization` | `None` ||
        | `PATCH`   | `/api/rooms/:slug/enrollees/:username`                | `Content-Type`, `Authorization` | `{ enrollees[{ points }] }` ||
        | `PATCH`   | `/api/rooms/:slug/enrollees/:username/badges/:order`  | `Content-Type`, `Authorization` | `None` ||
        | `PATCH`   | `/api/rooms/:slug/reward`                             | `Content-Type`, `Authorization` | `{ username(learner), badge(id) }` ||
        | `PATCH`   | `/api/rooms/:slug/feature`                            | `Content-Type`, `Authorization` | `{ username(learner), badge(id) }` ||
        | `PATCH`   | `/api/rooms/:slug/archiving`                          | `Content-Type`, `Authorization` | `{ is_archived }` ||
        | `DELETE`  | `/api/rooms/:slug`                                    | `Content-Type`, `Authorization` | `None` ||
2. `GroupProgress`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/gps/`                       | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/gps/:id`                    | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/gps/:id/enrollees/:slug`    | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/gps/room/:slug`             | `Content-Type`, `Authorization` | `None` | `None` |
        | `POST`    | `/api/gps/setup`                  | `Content-Type`, `Authorization` | `{ requirements[{ type, description, milestones, filenames }], room(slug) }` ||
        | `PATCH`   | `/api/gps/:id`                    | `Content-Type`, `Authorization` | `{ requirements[{ type, description, milestones, filenames }], room(slug) }` ||
        | `DELETE`  | `/api/gps/:id`                    | `Content-Type`, `Authorization` | `None` ||
3. `LiveCoding`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/liverooms/`                 | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/liverooms/:id`              | `Content-Type`, `Authorization` | `None` | `None` |
        | `POST`    | `/api/liverooms/start`            | `Content-Type`, `Authorization` | `{ test_case, language_used, code, call_link }` ||
        | `PATCH`   | `/api/liverooms/:id/add`          | `Content-Type`, `Authorization` | `{ username(learner) }` ||
        | `PATCH`   | `/api/liverooms/:id/remove`       | `Content-Type`, `Authorization` | `{ username(learner) }` ||
        | `PATCH`   | `/api/liverooms/:id/live-update`  | `Content-Type`, `Authorization` | `{ test_case, language_used, code, call_link, editor(username) }` ||
        | `DELETE`  | `/api/liverooms/:id/end`          | `Content-Type`, `Authorization` | `None` ||
4. `Problem`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/problems/`                  | `Content-Type`, `Authorization` | `None` | `{ *is_archived, *limit }` |
        | `GET`     | `/api/problems/difficulties`      | `Content-Type` | `None` | `None` |
        | `GET`     | `/api/problems/:slug`             | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/problems/mentor/:username`  | `Content-Type`, `Authorization` | `None` | `{ *is_archived, *limit }` |
        | `POST`    | `/api/problems/publish`           | `Content-Type`, `Authorization` | `{ name, description, input_format, output_format, constraints, release, deadline, languages[{ name, code_snippet, time_complexity, space_complexity }], test_cases[{ input, output, is_sample, is_eval, strength }], mentor(username) }` ||
        | `PATCH`   | `/api/problems/:slug/archiving`   | `Content-Type`, `Authorization` | `{ is_archived }` ||
        | `PATCH`   | `/api/problems/:slug/reshcedule`  | `Content-Type`, `Authorization` | `{ release, deadline }` ||
        | `DELETE`  | `/api/problems/:slug`             | `Content-Type`, `Authorization` | `None` ||
---
### **External-related Routes:**
1. `AttemptTracker`
    - Structure
        | Method | Path | Header Requirement | Body Requirement | Query Params |
        | :---: | :--- | :---: | :--- | :--- |
        | `GET`     | `/api/attempts/`                  | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/attempts/get`               | `Content-Type`, `Authorization` | `None` | `{ username(learner), problem_slug(problem), room_slug(room) }` |
        | `GET`     | `/api/attempts/:id`               | `Content-Type`, `Authorization` | `None` | `None` |
        | `GET`     | `/api/attempts/learner/:username` | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/attempts/problem/:slug`     | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `GET`     | `/api/attempts/room/:slug`        | `Content-Type`, `Authorization` | `None` | `{ *limit }` |
        | `POST`    | `/api/attempts/track`             | `Content-Type`, `Authorization` | `{ date_time, attempt_time, learner(username), problem(slug) }`||