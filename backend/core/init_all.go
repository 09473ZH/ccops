package core

func InitAll() error {
	InitUser()
	InitAIConfiguration()
	InitSystemConfiguration()
	err := InitKeysConfiguration()
	if err != nil {
		return err
	}
	return nil

}
