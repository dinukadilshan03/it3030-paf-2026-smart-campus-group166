Current stack is a Java Spring backend + React TypeScript frontend.

- Backend:
1. Java 21 (pom.xml)
2. Spring Boot 3.5.11 (pom.xml)
3. Spring modules: Web, Data JPA, Security, OAuth2 Client, Validation, Actuator (pom.xml)
4. PostgreSQL database + Hibernate/JPA (pom.xml, application.properties)
5. Maven build system (pom.xml)
6. Lombok and spring-dotenv (pom.xml)
7. Testing: Spring Boot Test + Spring Security Test (pom.xml)

- Frontend:
1. React 19 + React DOM 19 (package.json)
2. TypeScript 5.9 (package.json)
3. Vite 7 + plugin-react (package.json, vite.config.ts)
4. React Router DOM 7 (package.json)
5. Axios for API calls (package.json)
6. ESLint 9 with TypeScript/React plugins (package.json)
7. Strict TS compiler settings targeting ES2022 (tsconfig.app.json)

So overall: full-stack monorepo with Spring Boot + PostgreSQL on the backend, and React + TypeScript + Vite on the frontend.