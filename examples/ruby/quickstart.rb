#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require 'net/http'
require 'uri'

api_key = ENV['CHEFU_API_KEY']
abort('Set CHEFU_API_KEY before running this example.') if api_key.nil? || api_key.empty?

base_url = (ENV['CHEFU_API_BASE_URL'] || 'https://api.chefuinc.com/api').delete_suffix('/')
uri = URI("#{base_url}/courses")
uri.query = URI.encode_www_form(limit: 5)

request = Net::HTTP::Get.new(uri)
request['Authorization'] = "Bearer #{api_key}"
request['Accept'] = 'application/json'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
  http.read_timeout = 10
  http.request(request)
end

unless response.is_a?(Net::HTTPSuccess)
  abort("CheFu API error #{response.code}: #{response.body}")
end

data = JSON.parse(response.body)
data.fetch('courses', []).each do |course|
  title = course['courseTitle'] || course['title'] || course['id'] || 'Untitled course'
  puts "- #{title}"
end
