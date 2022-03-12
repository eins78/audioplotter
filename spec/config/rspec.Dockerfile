FROM ruby:3.1.1-slim

# deps
RUN apt-get update -yqq && \
    apt-get install -yqq --no-install-recommends \
      build-essential zip unzip libpq-dev libaio1 libaio-dev \
      nodejs

# system
RUN echo "gem: --no-rdoc --no-ri" >> ~/.gemrc
ENV BUNDLE_PATH /gems

RUN gem update --system
RUN gem install bundler

# runtime
VOLUME ["/app"]
WORKDIR /app/spec
# ENV BUNDLE_GEMFILE /app/spec/Gemfile

COPY Gemfile Gemfile.lock ./
RUN bundle install