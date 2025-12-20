
FROM node:20-alpine

COPY /server/dist ./dist

CMD ["node", "dist/index.cjs"]
