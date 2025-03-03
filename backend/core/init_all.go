package core

func InitAll() error {
	InitDb()
	InitAIConfiguration()
	InitSystemConfiguration()
	InitUser()
	err := InitKeysConfiguration()
	if err != nil {
		return err
	}
	return nil

}
