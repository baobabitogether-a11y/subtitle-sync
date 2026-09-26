FROM mcr.microsoft.com/playwright:v1.63.0-noble

ENV CI=true
ENV NODE_ENV=test

WORKDIR /workspace

COPY package.json package-lock.json .npmrc ./

# The imported lockfile can contain Replit's internal package host. Replace it
# inside the image so Docker builds remain portable outside Replit. The
# Playwright image ships a newer npm than the lockfile's original environment;
# npm install repairs optional-platform metadata while preserving package-lock.
RUN sed -i -E 's#https?://package-firewall\.replit\.internal/npm/#https://registry.npmjs.org/#g' package-lock.json \
  && npm install --no-audit --no-fund

COPY . .

RUN mkdir -p /workspace/test-results /workspace/playwright-report

CMD ["npm", "run", "test:e2e:web"]