package core

func InitAll() error {
	if err := InitJwtSecret(); err != nil {
		return err
	}
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
