package query

func GetAuthorizedKeys() ([]map[string]string, error) {
	authorizedKeys, err := RunQuery("SELECT username, directory, shell, algorithm, comment, key, key_file  FROM users CROSS JOIN authorized_keys USING (uid);")
	if err != nil {
		return nil, err
	}
	return authorizedKeys, nil
}
