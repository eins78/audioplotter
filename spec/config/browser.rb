require 'capybara/rspec'
require 'selenium-webdriver'
# require 'turnip/capybara'
# require 'turnip/rspec'

# DOCS:
# * https://www.rubydoc.info/github/jnicklas/capybara#configuring-and-adding-drivers
# * https://github.com/SeleniumHQ/selenium/wiki/Ruby-Bindings

SELENIUM_START_WAIT_SECONDS = 120

def register_driver
  http_client = Selenium::WebDriver::Remote::Http::Default.new
  http_client.read_timeout = 240 # seconds

  Capybara.register_driver :selenium_remote_firefox do |app|
    capabilities = Selenium::WebDriver::Remote::Capabilities.firefox

    Capybara::Selenium::Driver.new(app,
      browser: :remote,
      url: "#{ENV['SELENIUM_URL']}/wd/hub",
      capabilities: capabilities,
      http_client: http_client
    )
  end
end

def setup_driver
  unless ENV['SELENIUM_URL'].nil? || ENV['SELENIUM_URL'].empty?
    Capybara.current_driver = :selenium_remote_firefox
    Capybara.javascript_driver = :selenium_remote_firefox
    Capybara.app_host = ENV['APP_URL']
  end
end

def wait_for_selenium_connection
  url = URI.parse(ENV['SELENIUM_URL'])
  begin
    Timeout.timeout(SELENIUM_START_WAIT_SECONDS) do
      print "INFO: waiting for connection to Selenium at '#{url}'... "
      until
        begin; Net::HTTP.start(url.host, url.port, read_timeout: 1) { true }; rescue; end
      sleep 1
      end
    end
  rescue Timeout::Error => err
    puts; puts "ERROR: could not connect to Selenium at '#{url}'"
    throw err
  end
  puts 'OK!'
end


Capybara.run_server = false
Capybara.default_driver = :firefox
Capybara.current_driver = :firefox

Capybara.configure do |config|
  config.default_max_wait_time = 15
end

RSpec.configure do |config|
  register_driver
  wait_for_selenium_connection
  config.before(:each, type: :feature) do
    setup_driver
  end
end