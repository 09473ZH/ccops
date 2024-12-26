package core

func InitAll() error {
	InitAIConfiguration()
	InitSystemConfiguration()
	err := InitKeysConfiguration()
	if err != nil {
		return err
	}
	return nil

}
