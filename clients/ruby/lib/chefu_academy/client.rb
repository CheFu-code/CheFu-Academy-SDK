require 'json'
require 'net/http'
require 'uri'

module CheFuAcademy
  DEFAULT_BASE_URL = 'https://api.chefuinc.com/api'

  class Error < StandardError
    attr_reader :status_code, :details

    def initialize(message, status_code: nil, details: nil)
      super(message)
      @status_code = status_code
      @details = details
    end
  end

  class Client
    attr_accessor :api_key, :auth_token

    def initialize(api_key: nil, auth_token: nil, base_url: DEFAULT_BASE_URL, timeout: 10)
      @api_key = api_key
      @auth_token = auth_token
      @base_url = base_url.delete_suffix('/')
      @timeout = timeout
    end

    def login(email:, password:)
      session = request('POST', '/auth/login', body: { email: email, password: password }, api_key_auth: false)
      self.auth_token = session['idToken'] || session['token']
      session
    end

    def register(email:, password:, fullname:)
      request('POST', '/auth/register', body: { email: email, password: password, fullname: fullname }, api_key_auth: false)
    end

    def refresh(refresh_token:)
      session = request('POST', '/auth/refresh', body: { refreshToken: refresh_token }, api_key_auth: false)
      self.auth_token = session['idToken'] || session['token']
      session
    end

    def list_courses(**query)
      request('GET', '/courses', query: query)
    end

    def search_courses(**query)
      request('GET', '/courses/search', query: query)
    end

    def featured_courses(**query)
      request('GET', '/courses/featured', query: query)
    end

    def course_categories
      request('GET', '/courses/categories')
    end

    def course(course_id)
      request('GET', "/courses/#{escape(course_id)}")
    end

    def course_chapters(course_id)
      request('GET', "/courses/#{escape(course_id)}/chapters")
    end

    def course_chapter(course_id, chapter_index)
      request('GET', "/courses/#{escape(course_id)}/chapters/#{chapter_index}")
    end

    def course_lessons(course_id, chapter_index)
      request('GET', "/courses/#{escape(course_id)}/chapters/#{chapter_index}/lessons")
    end

    def course_quiz(course_id)
      request('GET', "/courses/#{escape(course_id)}/quiz")
    end

    def course_flashcards(course_id)
      request('GET', "/courses/#{escape(course_id)}/flashcards")
    end

    def course_qa(course_id)
      request('GET', "/courses/#{escape(course_id)}/qa")
    end

    def list_videos(**query)
      request('GET', '/videos', query: query)
    end

    def search_videos(**query)
      request('GET', '/videos/search', query: query)
    end

    def videos_by_category(category)
      request('GET', "/videos/category/#{escape(category)}")
    end

    def video(video_id)
      request('GET', "/videos/#{escape(video_id)}")
    end

    def create_key(name: nil)
      request('POST', '/keys/create', body: { name: name }, user_auth: true, api_key_auth: false)
    end

    def list_keys
      request('GET', '/keys/list', user_auth: true, api_key_auth: false)
    end

    def revoke_key(key_id)
      request('POST', '/keys/revoke', body: { keyId: key_id }, user_auth: true, api_key_auth: false)
    end

    private

    def request(method, path, query: {}, body: nil, user_auth: false, api_key_auth: true)
      token = user_auth ? auth_token : api_key
      raise Error.new('User authentication is required.', status_code: 401) if user_auth && blank?(token)
      raise Error.new('API key is required.', status_code: 401) if api_key_auth && !user_auth && blank?(token)

      uri = URI("#{@base_url}#{path}")
      clean_query = query.reject { |_key, value| value.nil? || value.to_s.empty? }
      uri.query = URI.encode_www_form(clean_query) unless clean_query.empty?

      request = Net::HTTP.const_get(method.capitalize).new(uri)
      request['Accept'] = 'application/json'
      request['Authorization'] = "Bearer #{token}" unless blank?(token)
      if body
        request['Content-Type'] = 'application/json'
        request.body = JSON.generate(body)
      end

      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https', read_timeout: @timeout) do |http|
        http.request(request)
      end

      decoded = response.body.nil? || response.body.empty? ? nil : JSON.parse(response.body)
      unless response.is_a?(Net::HTTPSuccess)
        raise Error.new(error_message(decoded, response.body), status_code: response.code.to_i, details: decoded)
      end

      decoded
    rescue JSON::ParserError => error
      raise Error.new("JSON parse error: #{error.message}")
    end

    def escape(value)
      URI.encode_www_form_component(value.to_s).gsub('+', '%20')
    end

    def blank?(value)
      value.nil? || value.to_s.empty?
    end

    def error_message(decoded, raw)
      if decoded.is_a?(Hash)
        message = decoded['message']
        return message.join(' ') if message.is_a?(Array)
        return message if message.is_a?(String) && !message.empty?
        error = decoded['error']
        return error if error.is_a?(String) && !error.empty?
      end

      raw.nil? || raw.empty? ? 'CheFu Academy request failed.' : raw
    end
  end
end
