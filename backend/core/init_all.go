package core

func InitAll() error {
	InitUser()
	InitAIConfiguration()
	InitSystemConfiguration()
	InitDb()
	err := InitKeysConfiguration()
	if err != nil {
		return err
	}
	return nil

}
